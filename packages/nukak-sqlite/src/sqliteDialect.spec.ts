import { createSpec, Item, User } from 'nukak/test';
import { AbstractSqlDialectSpec } from 'nukak/dialect/abstractSqlDialect-spec.js';
import { SqliteDialect } from './sqliteDialect.js';

class SqliteDialectSpec extends AbstractSqlDialectSpec {
  constructor() {
    super(new SqliteDialect());
  }

  override shouldBeginTransaction() {
    expect(this.dialect.beginTransactionCommand).toBe('BEGIN TRANSACTION');
  }

  override shouldFind$text() {
    expect(
      this.dialect.find(
        Item,
        {
          $filter: { $text: { $fields: ['name', 'description'], $value: 'some text' }, companyId: 1 },
          $limit: 30,
        },
        { id: true }
      )
    ).toBe('SELECT `id` FROM `Item` WHERE `Item` MATCH {`name` `description`} : ? AND `companyId` = ? LIMIT ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: {
            $text: { $fields: ['name'], $value: 'something' },
            name: { $ne: 'other unwanted' },
            companyId: 1,
          },
          $limit: 10,
        },
        { id: 1 }
      )
    ).toBe('SELECT `id` FROM `User` WHERE `User` MATCH {`name`} : ? AND `name` <> ? AND `companyId` = ? LIMIT ?');
  }
}

createSpec(new SqliteDialectSpec());
