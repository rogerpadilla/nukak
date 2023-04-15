import { User, Item, createSpec, TaxCategory } from 'nukak/test';
import { PostgresDialect } from './postgresDialect.js';

class PostgresDialectSpec {
  readonly dialect = new PostgresDialect();

  shouldBeValidEscapeCharacter() {
    expect(this.dialect.escapeIdChar).toBe('"');
  }

  shouldBeginTransaction() {
    expect(this.dialect.beginTransactionCommand).toBe('BEGIN TRANSACTION');
  }

  shouldInsertMany() {
    expect(
      this.dialect.insert(User, [
        {
          name: 'Some name 1',
          email: 'someemail1@example.com',
          createdAt: 123,
        },
        {
          name: 'Some name 2',
          email: 'someemail2@example.com',
          createdAt: 456,
        },
        {
          name: 'Some name 3',
          email: 'someemail3@example.com',
          createdAt: 789,
        },
      ])
    ).toBe('INSERT INTO "User" ("name", "email", "createdAt") VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?) RETURNING "id" "id"');
  }

  shouldInsertOne() {
    expect(
      this.dialect.insert(User, {
        name: 'Some Name',
        email: 'someemail@example.com',
        createdAt: 123,
      })
    ).toBe(`INSERT INTO "User" ("name", "email", "createdAt") VALUES (?, ?, ?) RETURNING "id" "id"`);
  }

  shouldInsertWithOnInsertId() {
    expect(
      this.dialect.insert(TaxCategory, {
        name: 'Some Name',
        createdAt: 123,
      })
    ).toBe(`INSERT INTO "TaxCategory" ("name", "createdAt", "pk") VALUES (?, ?, ?) RETURNING "pk" "id"`);
  }

  shouldFind$istartsWith() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $istartsWith: 'Some' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        ['id']
      )
    ).toBe(`SELECT "id" FROM "User" WHERE "name" ILIKE ? ORDER BY "name", "id" DESC LIMIT ? OFFSET ?`);

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $istartsWith: 'Some', $ne: 'Something' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        { id: true }
      )
    ).toBe(`SELECT "id" FROM "User" WHERE ("name" ILIKE ? AND "name" <> ?) ORDER BY "name", "id" DESC LIMIT ? OFFSET ?`);
  }

  shouldFind$iendsWith() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $iendsWith: 'Some' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        ['id']
      )
    ).toBe(`SELECT "id" FROM "User" WHERE "name" ILIKE ? ORDER BY "name", "id" DESC LIMIT ? OFFSET ?`);

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $iendsWith: 'Some', $ne: 'Something' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        { id: true }
      )
    ).toBe(`SELECT "id" FROM "User" WHERE ("name" ILIKE ? AND "name" <> ?) ORDER BY "name", "id" DESC LIMIT ? OFFSET ?`);
  }

  shouldFind$iincludes() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $iincludes: 'Some' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        ['id']
      )
    ).toBe(`SELECT "id" FROM "User" WHERE "name" ILIKE ? ORDER BY "name", "id" DESC LIMIT ? OFFSET ?`);

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $iincludes: 'Some', $ne: 'Something' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        { id: true }
      )
    ).toBe(`SELECT "id" FROM "User" WHERE ("name" ILIKE ? AND "name" <> ?) ORDER BY "name", "id" DESC LIMIT ? OFFSET ?`);
  }

  shouldFind$ilike() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $ilike: 'Some' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        ['id']
      )
    ).toBe(`SELECT "id" FROM "User" WHERE "name" ILIKE ? ORDER BY "name", "id" DESC LIMIT ? OFFSET ?`);

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $ilike: 'Some', $ne: 'Something' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        { id: true }
      )
    ).toBe(`SELECT "id" FROM "User" WHERE ("name" ILIKE ? AND "name" <> ?) ORDER BY "name", "id" DESC LIMIT ? OFFSET ?`);
  }

  shouldFind$regex() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $regex: '^some' } },
        },
        { id: true }
      )
    ).toBe(`SELECT "id" FROM "User" WHERE "name" ~ ?`);
  }

  shouldFind$text() {
    expect(
      this.dialect.find(
        Item,
        {
          $filter: { $text: { $fields: ['name', 'description'], $value: 'some text' }, code: '1' },
          $limit: 30,
        },
        { id: true }
      )
    ).toBe(`SELECT "id" FROM "Item" WHERE to_tsvector("name" || ' ' || "description") @@ to_tsquery(?) AND "code" = ? LIMIT ?`);

    expect(
      this.dialect.find(
        User,
        {
          $filter: {
            $text: { $fields: ['name'], $value: 'something' },
            name: { $ne: 'other unwanted' },
            creatorId: 1,
          },
          $limit: 10,
        },
        { id: true }
      )
    ).toBe(`SELECT "id" FROM "User" WHERE to_tsvector("name") @@ to_tsquery(?) AND "name" <> ? AND "creatorId" = ? LIMIT ?`);
  }
}

createSpec(new PostgresDialectSpec());
