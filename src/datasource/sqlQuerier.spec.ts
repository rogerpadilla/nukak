import { QueryUpdateResult } from '../type';
import { User } from '../entity/entityMock';
import { SqlQuerier } from './sqlQuerier';
import { MySqlQuerier } from './mysql/mysqlQuerier';
import { PostgresQuerier } from './postgres/postgresQuerier';

describe.each([MySqlQuerier, PostgresQuerier])('sqlQuerier %p', (Querier) => {
  let mockRes: User[] | QueryUpdateResult;
  let querier: SqlQuerier;

  beforeEach(() => {
    querier = new Querier({
      query: () => {
        let res: any;
        if (Querier === MySqlQuerier) {
          res = [mockRes];
        } else {
          res = { rows: mockRes };
        }
        return Promise.resolve(res);
      },
      release: () => Promise.resolve(),
    });
    jest.spyOn(querier, 'query');
    jest.spyOn(querier, 'beginTransaction');
    jest.spyOn(querier, 'commit');
    jest.spyOn(querier, 'rollback');
    jest.spyOn(querier, 'release');
  });

  it('find', async () => {
    const mock: User[] = [{ id: 1, name: 'something' }];
    mockRes = mock;
    const resp = await querier.find(User, { project: { id: 1, name: 1 }, filter: { company: 123 }, limit: 100 });
    expect(resp).toEqual(mock);
    expect(querier.query).toBeCalledWith('SELECT `id`, `name` FROM `User` WHERE `company` = 123 LIMIT 100');
    expect(querier.query).toBeCalledTimes(1);
    expect(querier.beginTransaction).not.toBeCalled();
    expect(querier.commit).not.toBeCalled();
    expect(querier.rollback).not.toBeCalled();
    expect(querier.release).not.toBeCalled();
  });

  it('remove', async () => {
    const mock: QueryUpdateResult = { affectedRows: 1 };
    mockRes = mock;
    const resp = await querier.remove(User, { company: 123 });
    expect(resp).toEqual(mock.affectedRows);
    expect(querier.query).toBeCalledWith('DELETE FROM `User` WHERE `company` = 123');
    expect(querier.query).toBeCalledTimes(1);
    expect(querier.beginTransaction).not.toBeCalled();
    expect(querier.commit).not.toBeCalled();
    expect(querier.rollback).not.toBeCalled();
    expect(querier.release).not.toBeCalled();
  });

  it('insertOne', async () => {
    const mock: QueryUpdateResult = { insertId: 1 };
    mockRes = mock;
    const resp = await querier.insertOne(User, { company: 123 });
    expect(resp).toEqual(mock.insertId);
    expect(querier.query).toBeCalledWith(expect.toStartsWith('INSERT INTO `User` (`company`) VALUES (123)'));
    expect(querier.query).toBeCalledTimes(1);
    expect(querier.beginTransaction).not.toBeCalled();
    expect(querier.commit).not.toBeCalled();
    expect(querier.rollback).not.toBeCalled();
    expect(querier.release).not.toBeCalled();
  });

  it('update', async () => {
    const mock: QueryUpdateResult = { affectedRows: 5 };
    mockRes = mock;
    const resp = await querier.update(User, { id: 5 }, { name: 'Hola' });
    expect(resp).toEqual(mock.affectedRows);
    expect(querier.query).toBeCalledWith("UPDATE `User` SET `name` = 'Hola' WHERE `id` = 5");
    expect(querier.query).toBeCalledTimes(1);
    expect(querier.beginTransaction).not.toBeCalled();
    expect(querier.commit).not.toBeCalled();
    expect(querier.rollback).not.toBeCalled();
    expect(querier.release).not.toBeCalled();
  });

  it('transaction', async () => {
    expect(querier.hasOpenTransaction()).toBeFalsy();
    await querier.beginTransaction();
    expect(querier.hasOpenTransaction()).toBe(true);
    await querier.update(User, { id: 5 }, { name: 'Hola' });
    expect(querier.hasOpenTransaction()).toBe(true);
    await querier.commit();
    expect(querier.hasOpenTransaction()).toBeFalsy();
    querier.release();
    expect(querier.hasOpenTransaction()).toBeFalsy();
    expect(querier.query).toBeCalledTimes(3);
    expect(querier.beginTransaction).toBeCalledTimes(1);
    expect(querier.commit).toBeCalledTimes(1);
    expect(querier.rollback).not.toBeCalled();
    expect(querier.release).toBeCalledTimes(1);
  });

  it('transaction beging pending', async () => {
    expect(querier.hasOpenTransaction()).toBeFalsy();
    await querier.beginTransaction();
    expect(querier.hasOpenTransaction()).toBe(true);
    await expect(querier.beginTransaction()).rejects.toThrow('There is a pending transaction.');
    expect(querier.hasOpenTransaction()).toBe(true);
    expect(querier.query).toBeCalledTimes(1);
    expect(querier.beginTransaction).toBeCalledTimes(2);
    expect(querier.commit).not.toBeCalled();
    expect(querier.rollback).not.toBeCalled();
    expect(querier.release).not.toBeCalled();
  });

  it('transaction commit no pending', async () => {
    expect(querier.hasOpenTransaction()).toBeFalsy();
    await expect(querier.commit()).rejects.toThrow('There is not a pending transaction.');
    expect(querier.hasOpenTransaction()).toBeFalsy();
    expect(querier.query).toBeCalledTimes(0);
    expect(querier.beginTransaction).toBeCalledTimes(0);
    expect(querier.commit).toBeCalledTimes(1);
    expect(querier.rollback).not.toBeCalled();
    expect(querier.release).toBeCalledTimes(0);
  });

  it('transaction rollback no pending', async () => {
    expect(querier.hasOpenTransaction()).toBeFalsy();
    await expect(querier.rollback()).rejects.toThrow('There is not a pending transaction.');
    expect(querier.hasOpenTransaction()).toBeFalsy();
    expect(querier.query).toBeCalledTimes(0);
    expect(querier.beginTransaction).toBeCalledTimes(0);
    expect(querier.commit).not.toBeCalled();
    expect(querier.rollback).toBeCalledTimes(1);
    expect(querier.release).toBeCalledTimes(0);
  });

  it('transaction release pending', async () => {
    expect(querier.hasOpenTransaction()).toBeFalsy();
    await querier.beginTransaction();
    expect(querier.hasOpenTransaction()).toBe(true);
    await querier.update(User, { id: 5 }, { name: 'Hola' });
    expect(querier.hasOpenTransaction()).toBe(true);
    await expect(querier.release()).rejects.toThrow('Querier should not be released while there is an open transaction.');
    expect(querier.hasOpenTransaction()).toBe(true);
    expect(querier.query).toBeCalledTimes(2);
    expect(querier.beginTransaction).toBeCalledTimes(1);
    expect(querier.commit).not.toBeCalled();
    expect(querier.rollback).not.toBeCalled();
    expect(querier.release).toBeCalledTimes(1);
  });
});
