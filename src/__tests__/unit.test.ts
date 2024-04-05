import { DeltaMap } from '../index';

type BasicEntryType = string;

test('absurd but necessary indexes', () => {
  const map = new DeltaMap();
  const num = 1000000;
  map.set(num, 'hello');
  const out = `${map}`;
  expect((out.match(/\[/g) || []).length).toBe((num >> 8) + 1);
});

test('one entry', () => {
  const map = new DeltaMap<BasicEntryType>();
  map.set(10, 'hello 1');
  expect(`${map}`).toBe('[0-9:null,10--1:hello 1]');
});

test('one entry with hard stop', () => {
  const map = new DeltaMap<BasicEntryType>();
  map.set(10, 'hello 2', 15);
  expect(`${map}`).toBe('[0-9:null,10-15:hello 2,16--1:null]');
});

test('on separate rows', () => {
  const map = new DeltaMap<BasicEntryType>();
  map.set(300, 'hello 2', 500);
  map.set(400, 'hello 3', 800);
  map.set(700, 'hello 4');
  expect(`${map}`).toBe(
    '[0-299:null],[300-399:hello 2,400-699:hello 3],[700-800:hello 4],[801--1:null]'
  );
});

test('on separate with deletion', () => {
  const map = new DeltaMap<BasicEntryType>();
  map.set(300, 'hello 2', 500);
  map.set(200, 'hello 3', 800);
  map.set(700, 'hello 4');
  expect(`${map}`).toBe(
    '[0-199:null,200-699:hello 3],[],[700-800:hello 4],[801--1:null]'
  );
});
