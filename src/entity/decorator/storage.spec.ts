import { User, Item } from '../entityMock';
import { getEntityMeta } from './storage';

it('user', () => {
  const meta = getEntityMeta(User);
  expect(meta).toEqual({
    id: 'id',
    columns: {
      company: {
        mode: 'insert',
      },
      createdAt: {
        mode: 'insert',
      },
      email: {},
      id: {
        mode: 'read',
      },
      name: {},
      password: {},
      status: {},
      updatedAt: {
        mode: 'update',
      },
      user: {
        mode: 'insert',
      },
    },
    merged: true,
    relations: {
      company: {
        cardinality: 'manyToOne',
        type: expect.any(Function),
      },
      user: {
        cardinality: 'manyToOne',
        type: expect.any(Function),
      },
    },
  });
});

it('item', () => {
  const meta = getEntityMeta(Item);
  expect(meta).toEqual({
    id: 'id',
    columns: {
      barcode: {},
      buyLedgerAccount: {},
      buyPriceAverage: {
        mode: 'read',
      },
      code: {},
      company: {
        mode: 'insert',
      },
      createdAt: {
        mode: 'insert',
      },
      description: {},
      id: {
        mode: 'read',
      },
      image: {},
      inventoryable: {},
      measureUnit: {},
      name: {},
      saleLedgerAccount: {},
      salePrice: {},
      status: {},
      tax: {},
      updatedAt: {
        mode: 'update',
      },
      user: {
        mode: 'insert',
      },
    },
    merged: true,
    relations: {
      company: {
        cardinality: 'manyToOne',
        type: expect.any(Function),
      },
      user: {
        cardinality: 'manyToOne',
        type: expect.any(Function),
      },
      buyLedgerAccount: {
        cardinality: 'manyToOne',
        type: expect.any(Function),
      },
      measureUnit: {
        cardinality: 'manyToOne',
        type: expect.any(Function),
      },
      saleLedgerAccount: {
        cardinality: 'manyToOne',
        type: expect.any(Function),
      },
      tax: {
        cardinality: 'manyToOne',
        type: expect.any(Function),
      },
    },
  });
});
