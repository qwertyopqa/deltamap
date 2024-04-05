type DeltaMapEntry<T> = {
  start: number;
  end: number;
  value: T;
};
type PosInfo = [number, number];
function setPosInfo(info: PosInfo, row: number, index: number) {
  info[0] = row;
  info[1] = index;
}

export class DeltaMap<T> {
  private _: DeltaMapEntry<T>[][];

  toString() {
    const o = this._;
    const c = o
      .map((r) => r.map((i) => `${i.start}-${i.end}:${i.value}`).join(','))
      .join('],[');
    return `[${c}]`;
  }

  constructor(init?: T) {
    const value = init || (null as any as T);
    const o = { start: 0, end: -1, value };
    this._ = [[o]];
  }

  private rowAt(idx: number): DeltaMapEntry<T>[] {
    while (idx >= this._.length) this._.push([]);
    return this._[idx];
  }

  private atRnI(rowidx: number, idx: number, info?: PosInfo): DeltaMapEntry<T> {
    if (info) setPosInfo(info, rowidx, idx);
    const row = this.rowAt(rowidx);
    return row[idx];
  }

  private delAt(i: PosInfo) {
    this.rowAt(i[0]).splice(i[1], 1);
  }

  private getBtwI(head: PosInfo, tail: PosInfo): PosInfo[] {
    const infos: PosInfo[] = [];
    let row = head[0];
    let idx = head[1] + 1;
    while (row < tail[0] || idx < tail[1]) {
      if (idx >= this._[row].length) {
        idx = 0;
        row++;
      } else {
        infos.push([row, idx]);
        idx++;
      }
    }
    return infos;
  }

  first(info?: PosInfo): DeltaMapEntry<T> {
    return this.atRnI(0, 0, info);
  }

  last(info?: PosInfo): DeltaMapEntry<T> {
    let rIdx = this._.length - 1;
    while (this._[rIdx].length === 0) rIdx--;
    return this.atRnI(rIdx, this._[rIdx].length - 1, info);
  }

  at(idx: number, info?: PosInfo): DeltaMapEntry<T> {
    // If the index is 0, we return the first element
    if (idx === 0) return this.first(info);
    if (idx === -1) return this.last(info);
    // Getting the index + it's row
    let rowIdx = idx >> 8;
    let row = this.rowAt(rowIdx);
    // If the row is empty or the first element is greater than idx, we need to go back and return the last registered entry
    if (row.length === 0 || row[0].start > idx) {
      while (row.length === 0) row = this._[--rowIdx];
      return this.atRnI(rowIdx, row.length - 1, info);
    }
    // Binary search
    let low = 0;
    let high = row.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const c = row[mid];
      if (c.start <= idx && (c.end === -1 || c.end >= idx))
        return this.atRnI(rowIdx, mid, info);
      if (c.start > idx) high = mid - 1;
      else low = mid + 1;
    }
  }

  set(start: number, v: T, end: number = -1): DeltaMapEntry<T> {
    const beforeInfo: PosInfo = [0, 0];
    const before = this.at(start, beforeInfo);
    if (end === -1) end = before.end;
    const afterInfo: PosInfo = [beforeInfo[0], beforeInfo[1]];
    const after = end === -1 ? before : this.at(end, afterInfo);
    // what's between before and after?
    if (before.start !== after.start) {
      const betweenInfos = this.getBtwI(beforeInfo, afterInfo);
      if (betweenInfos.length > 0) {
        // DELETE THEM!! ONCE!
        while (betweenInfos.length > 0) this.delAt(betweenInfos.pop());
        // Now, we are sure at we only have max 2 entries to deal with.
        before.end = after.start - 1;
        this.at(end, afterInfo); // we need to refresh the afterInfo data.
      }
    }
    const o = { start, end, value: v };
    const startRowIdx = start >> 8;
    const afterEndRowIdx = (end + 1) >> 8;
    const row = this.rowAt(startRowIdx);
    // first let's check the simplest cases: A) REPLACE B) INSIDE
    const bClone = { ...before };
    if (before.start === start) {
      // A) REPLACE VALUE
      before.value = v;
      if (before.end === end) return before;
    } else {
      // if it isn't the same before.start is necessairly lower than start.
      before.end = start - 1;
      if (beforeInfo[0] === startRowIdx) {
        row.splice(beforeInfo[1] + 1, 0, o);
        if (afterInfo[0] === startRowIdx) afterInfo[1]++;
      } else {
        row.unshift(o); // we know that'll be the first entry for that row
      }
    }
    if (bClone.end === end) return o;
    // FYI: o is already on the map; we just need to adjust what's after it.
    if (bClone.end === -1 || bClone.end > end) {
      // It's inside the before entry!
      bClone.start = end + 1;
      if (beforeInfo[0] === afterEndRowIdx) {
        // It was spliced once before, so we need to add it again
        row.splice(beforeInfo[1] + 2, 0, bClone);
      } else {
        const aeRow = this.rowAt(afterEndRowIdx);
        if (aeRow[0].start === o.start) {
          // 'o' is at the start of the array => it should go right after it
          aeRow.splice(1, 0, bClone);
        } else {
          // 'o' ain't at the start of the array => it should go at the start
          aeRow.unshift(bClone);
        }
      }
      return o;
    }
    // if we got this far then there are more entries in play.
    // move on and deal with the after entry
    if (end === after.end) {
      this.delAt(afterInfo);
    } else {
      after.start = end + 1;
      if (afterInfo[0] !== afterEndRowIdx) {
        this.delAt(afterInfo); // I believe we could pop() here...
        this.rowAt(afterEndRowIdx).unshift(after);
      }
    }
    return o;
  }
}
