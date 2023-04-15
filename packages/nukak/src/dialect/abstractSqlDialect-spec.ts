import { Company, InventoryAdjustment, Item, ItemAdjustment, MeasureUnit, Profile, Spec, Tax, TaxCategory, User } from '../test/index.js';
import type { FieldKey, QueryFilter } from '../type/index.js';
import { raw } from '../util/index.js';
import { AbstractSqlDialect } from './abstractSqlDialect.js';

export abstract class AbstractSqlDialectSpec implements Spec {
  constructor(readonly dialect: AbstractSqlDialect) {}

  shouldBeValidEscapeCharacter() {
    expect(this.dialect.escapeIdChar).toBe('`');
  }

  shouldBeginTransaction() {
    expect(this.dialect.beginTransactionCommand).toBe('START TRANSACTION');
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
    ).toBe('INSERT INTO `User` (`name`, `email`, `createdAt`) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)');
  }

  shouldInsertOne() {
    expect(
      this.dialect.insert(User, {
        name: 'Some Name',
        email: 'someemail@example.com',
        createdAt: 123,
      })
    ).toBe('INSERT INTO `User` (`name`, `email`, `createdAt`) VALUES (?, ?, ?)');

    expect(
      this.dialect.insert(InventoryAdjustment, {
        date: new Date(2021, 11, 31, 23, 59, 59, 999),
        createdAt: 123,
      })
    ).toBe('INSERT INTO `InventoryAdjustment` (`date`, `createdAt`) VALUES (?, ?, ?)');
  }

  shouldInsertWithOnInsertId() {
    expect(
      this.dialect.insert(TaxCategory, {
        name: 'Some Name',
        createdAt: 123,
      })
    ).toBe('INSERT INTO `TaxCategory` (`name`, `createdAt`, `pk`) VALUES (?, ?, ?)');
  }

  shouldInsertManyWithSpecifiedIdsAndOnInsertIdAsDefault() {
    expect(
      this.dialect.insert(TaxCategory, [
        {
          name: 'Some Name A',
        },
        {
          pk: '50',
          name: 'Some Name B',
        },
        {
          name: 'Some Name C',
        },
        {
          pk: '70',
          name: 'Some Name D',
        },
      ])
    ).toBe('INSERT INTO `TaxCategory` (`name`, `createdAt`, `pk`) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)');
  }

  shouldUpdate() {
    expect(
      this.dialect.update(
        User,
        { $filter: { name: 'some', creatorId: 123 } },
        {
          name: 'Some Text',
          updatedAt: 321,
        }
      )
    ).toBe('UPDATE `User` SET `name` = ?, `updatedAt` = ? WHERE `name` = ? AND `creatorId` = ?');
  }

  shouldFind() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { id: 123, name: { $ne: 'abc' } },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `id` = ? AND `name` <> ?');

    expect(
      this.dialect.find(
        Profile,
        {
          $filter: { pk: 123, picture: 'abc' },
        },
        ['pk', 'picture', 'companyId']
      )
    ).toBe('SELECT `pk`, `image` `picture`, `companyId` FROM `user_profile` WHERE `pk` = ? AND `image` = ?');

    expect(
      this.dialect.find(
        MeasureUnit,
        {
          $filter: { id: 123, name: 'abc' },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `MeasureUnit` WHERE `id` = ? AND `name` = ? AND `deletedAt` IS NULL');
  }

  shouldBeSecure() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: {
            id: 1,
            something: 1,
          } as any,
          $sort: {
            id: 1,
            something: 1,
          } as any,
          $group: ['id', 'something' as any],
        },
        ['id', 'something' as FieldKey<User>]
      )
    ).toBe('SELECT `id` FROM `User` WHERE `id` = ? AND `something` = ? GROUP BY `id`, `something` ORDER BY `id`, `something`');

    expect(
      this.dialect.insert(User, {
        name: 'Some Name',
        something: 'anything',
        createdAt: 1,
      } as any)
    ).toBe('INSERT INTO `User` (`name`, `createdAt`) VALUES (?, ?)');

    expect(
      this.dialect.update(
        User,
        {
          $filter: { something: 'anything' },
        },
        {
          name: 'Some Name',
          something: 'anything',
          updatedAt: 1,
        } as any
      )
    ).toBe('UPDATE `User` SET `name` = ?, `updatedAt` = ? WHERE `something` = ?');

    expect(
      this.dialect.delete(User, {
        $filter: { something: 'anything' } as any,
      })
    ).toBe('DELETE FROM `User` WHERE `something` = ?');
  }

  shouldFind$and() {
    const sql = 'SELECT `id` FROM `User` WHERE `id` = ? AND `name` = ?';

    expect(
      this.dialect.find(
        User,
        {
          $filter: { $and: [{ id: 123, name: 'abc' }] },
        },
        ['id']
      )
    ).toBe(sql);

    expect(
      this.dialect.find(
        User,
        {
          $filter: { $and: [{ id: 123 }], name: 'abc' },
        },
        { id: 1 }
      )
    ).toBe(sql);
  }

  shouldFind$or() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { $or: [{ id: 123 }, { name: 'abc' }] },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `id` = ? OR `name` = ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { $or: [{ id: 123 }] },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `id` = ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { $or: [{ id: 123, name: 'abc' }] },
        },
        { id: 1 }
      )
    ).toBe('SELECT `id` FROM `User` WHERE `id` = ? AND `name` = ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { $or: [{ id: 123 }], name: 'abc' },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `id` = ? AND `name` = ?');
  }

  shouldFind$not() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { $not: [{ name: 'Some' }] },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE NOT `name` = ?');

    expect(
      this.dialect.find(
        Company,
        {
          $filter: { id: { $not: 123 } },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `Company` WHERE NOT `id` = ?');

    expect(
      this.dialect.find(
        Company,
        {
          $filter: { id: { $not: [123, 456] } },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `Company` WHERE NOT `id` IN (?)');

    expect(
      this.dialect.find(
        Company,
        {
          $filter: { id: 123, name: { $not: { $startsWith: 'a' } } },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `Company` WHERE `id` = ? AND NOT `name` LIKE ?');

    expect(
      this.dialect.find(
        Company,
        {
          $filter: { name: { $not: { $startsWith: 'a', $endsWith: 'z' } } },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `Company` WHERE NOT (`name` LIKE ? AND `name` LIKE ?)');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { $not: [{ name: { $like: 'Some', $ne: 'Something' } }] },
        },
        { id: true }
      )
    ).toBe('SELECT `id` FROM `User` WHERE NOT (`name` LIKE ? AND `name` <> ?)');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { $not: [{ name: 'abc' }, { creatorId: 1 }] },
        },
        { id: true }
      )
    ).toBe('SELECT `id` FROM `User` WHERE NOT (`name` = ? AND `creatorId` = ?)');

    expect(
      this.dialect.find(
        Tax,
        {
          $filter: { companyId: 1, name: { $not: { $startsWith: 'a' } } },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `Tax` WHERE `companyId` = ? AND NOT `name` LIKE ?');
  }

  shouldFind$nor() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { $nor: [{ name: 'Some' }] },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE NOT `name` = ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { $nor: [{ name: { $like: 'Some', $ne: 'Something' } }] },
        },
        { id: true }
      )
    ).toBe('SELECT `id` FROM `User` WHERE NOT (`name` LIKE ? AND `name` <> ?)');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { $nor: [{ name: 'abc' }, { creatorId: 1 }] },
        },
        { id: true }
      )
    ).toBe('SELECT `id` FROM `User` WHERE NOT (`name` = ? OR `creatorId` = ?)');
  }

  shouldFind$orAnd$and() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { creatorId: 1, $or: [{ name: ['a', 'b', 'c'] }, { email: 'abc@example.com' }], id: 1 },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `creatorId` = ? AND (`name` IN (?) OR `email` = ?) AND `id` = ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: {
            creatorId: 1,
            $or: [{ name: ['a', 'b', 'c'] }, { email: 'abc@example.com' }],
            id: 1,
            email: 'e',
          },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `creatorId` = ?' + ' AND (`name` IN (?) OR `email` = ?) AND `id` = ? AND `email` = ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: {
            creatorId: 1,
            $or: [{ name: ['a', 'b', 'c'] }, { email: 'abc@example.com' }],
            id: 1,
            email: 'e',
          },
          $sort: { name: 1, createdAt: -1 },
          $skip: 50,
          $limit: 10,
        },
        ['id']
      )
    ).toBe(
      'SELECT `id` FROM `User` WHERE `creatorId` = ?' +
        ' AND (`name` IN (?) OR `email` = ?)' +
        ' AND `id` = ? AND `email` = ?' +
        ' ORDER BY `name`, `createdAt` DESC LIMIT ? OFFSET ?'
    );

    expect(
      this.dialect.find(
        User,
        {
          $filter: {
            $or: [
              {
                creatorId: 1,
                id: 1,
                email: 'e',
              },
              { name: ['a', 'b', 'c'], email: 'abc@example.com' },
            ],
          },
          $sort: [
            { field: 'name', sort: 'asc' },
            { field: 'createdAt', sort: 'desc' },
          ],
          $skip: 50,
          $limit: 10,
        },
        ['id']
      )
    ).toBe(
      'SELECT `id` FROM `User` WHERE (`creatorId` = ? AND `id` = ? AND `email` = ?)' +
        ' OR (`name` IN (?) AND `email` = ?)' +
        ' ORDER BY `name`, `createdAt` DESC LIMIT ? OFFSET ?'
    );
  }

  shouldFindSingle$filter() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: 'some' },
          $limit: 3,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `name` = ? LIMIT ?');
  }

  shouldFindMultipleComparisonOperators() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { $or: [{ name: { $eq: 'other', $ne: 'other unwanted' } }, { companyId: 1 }] },
        },
        ['id']
      )
    ).toBe("SELECT `id` FROM `User` WHERE (`name` = 'other' AND `name` <> 'other unwanted') OR `companyId` = ?");

    expect(
      this.dialect.find(
        User,
        {
          $filter: { createdAt: { $gte: 123, $lte: 999 } },
          $limit: 10,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE (`createdAt` >= ? AND `createdAt` <= ?) LIMIT ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { createdAt: { $gt: 123, $lt: 999 } },
          $limit: 10,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE (`createdAt` > ? AND `createdAt` < ?) LIMIT ?');
  }

  shouldFind$ne() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: 'some', companyId: { $ne: 5 } },
          $limit: 20,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `name` = ? AND `companyId` <> ? LIMIT ?');
  }

  shouldFindIsNull() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { creatorId: 123, companyId: null },
          $limit: 5,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `creatorId` = ? AND `companyId` IS NULL LIMIT ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { creatorId: 123, companyId: { $ne: null } },
          $limit: 5,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `creatorId` = ? AND `companyId` IS NOT NULL LIMIT ?');
  }

  shouldFind$in() {
    const sql = 'SELECT `id` FROM `User` WHERE `name` = ? AND `companyId` IN (?) LIMIT ?';
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: 'some', companyId: [1, 2, 3] },
          $limit: 10,
        },
        ['id']
      )
    ).toBe(sql);
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: 'some', companyId: { $in: [1, 2, 3] } },
          $limit: 10,
        },
        ['id']
      )
    ).toBe(sql);
  }

  shouldFind$nin() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: 'some', companyId: { $nin: [1, 2, 3] } },
          $limit: 10,
        },
        ['id']
      )
    ).toBe("SELECT `id` FROM `User` WHERE `name` = 'some' AND `companyId` NOT IN (?) LIMIT ?");
  }

  shouldFind$projectFields() {
    expect(this.dialect.find(User, {}, { id: true, company: true })).toBe(
      'SELECT `User`.`id`, `company`.`id` `company.id`, `company`.`companyId` `company.companyId`, `company`.`creatorId` `company.creatorId`' +
        ', `company`.`createdAt` `company.createdAt`, `company`.`updatedAt` `company.updatedAt`' +
        ', `company`.`name` `company.name`, `company`.`description` `company.description`' +
        ' FROM `User` LEFT JOIN `Company` `company` ON `company`.`id` = `User`.`companyId`'
    );
  }

  shouldFind$projectOneToOne() {
    expect(this.dialect.find(User, {}, { id: true, name: true, profile: ['id', 'picture'] })).toBe(
      'SELECT `User`.`id`, `User`.`name`, `profile`.`pk` `profile.pk`, `profile`.`image` `profile.picture` FROM `User`' +
        ' LEFT JOIN `user_profile` `profile` ON `profile`.`creatorId` = `User`.`id`'
    );

    expect(this.dialect.find(User, {}, { profile: true })).toBe(
      'SELECT `User`.`id`, `profile`.`companyId` `profile.companyId`' +
        ', `profile`.`creatorId` `profile.creatorId`, `profile`.`createdAt` `profile.createdAt`' +
        ', `profile`.`updatedAt` `profile.updatedAt`' +
        ', `profile`.`pk` `profile.pk`, `profile`.`image` `profile.picture`' +
        ' FROM `User` LEFT JOIN `user_profile` `profile` ON `profile`.`creatorId` = `User`.`id`'
    );
  }

  shouldFind$projectManyToOne() {
    expect(
      this.dialect.find(
        Item,
        {
          $limit: 100,
        },
        {
          id: true,
          name: true,
          code: true,
          tax: { $project: ['id', 'name'], $required: true },
          measureUnit: { $project: ['id', 'name', 'categoryId'] },
        }
      )
    ).toBe(
      'SELECT `Item`.`id`, `Item`.`name`, `Item`.`code`' +
        ', `tax`.`id` `tax.id`, `tax`.`name` `tax.name`' +
        ', `measureUnit`.`id` `measureUnit.id`, `measureUnit`.`name` `measureUnit.name`, `measureUnit`.`categoryId` `measureUnit.categoryId`' +
        ' FROM `Item`' +
        ' INNER JOIN `Tax` `tax` ON `tax`.`id` = `Item`.`taxId`' +
        ' LEFT JOIN `MeasureUnit` `measureUnit` ON `measureUnit`.`id` = `Item`.`measureUnitId`' +
        ' LIMIT ?'
    );
  }

  shouldFind$projectWithAllFieldsAndSpecificFieldsAndFilter() {
    expect(
      this.dialect.find(
        Item,
        {
          $filter: { salePrice: { $gte: 1000 }, name: { $istartsWith: 'A' } },
          $sort: { tax: { name: 1 }, measureUnit: { name: 1 }, createdAt: -1 },
          $limit: 100,
        },
        {
          id: true,
          name: true,
          measureUnit: { $project: ['id', 'name'], $filter: { name: { $ne: 'unidad' } }, $required: true },
          tax: ['id', 'name'],
        }
      )
    ).toBe(
      'SELECT `Item`.`id`, `Item`.`name`' +
        ', `measureUnit`.`id` `measureUnit.id`, `measureUnit`.`name` `measureUnit.name`' +
        ', `tax`.`id` `tax.id`, `tax`.`name` `tax.name`' +
        ' FROM `Item`' +
        " INNER JOIN `MeasureUnit` `measureUnit` ON `measureUnit`.`id` = `Item`.`measureUnitId` AND `measureUnit`.`name` <> 'unidad' AND `measureUnit`.`deletedAt` IS NULL" +
        ' LEFT JOIN `Tax` `tax` ON `tax`.`id` = `Item`.`taxId`' +
        ' WHERE `Item`.`salePrice` >= ? AND LOWER(`Item`.`name`) LIKE ?' +
        ' ORDER BY `tax`.`name`, `measureUnit`.`name`, `Item`.`createdAt` DESC LIMIT ?'
    );
  }

  shouldVirtualField() {
    expect(
      this.dialect.find(
        Item,
        {
          $filter: {
            tagsCount: { $gte: 10 },
          },
        },
        {
          id: 1,
        }
      )
    ).toBe('SELECT `id` FROM `Item` WHERE (SELECT COUNT(*) `count` FROM `ItemTag` WHERE `ItemTag`.`itemId` = `id`) >= ?');

    expect(
      this.dialect.find(
        Item,
        {
          $limit: 100,
        },
        {
          id: 1,
          name: 1,
          code: 1,
          tagsCount: 1,
          measureUnit: {
            $project: { id: 1, name: 1, categoryId: 1, category: ['name'] },
          },
        }
      )
    ).toBe(
      'SELECT `Item`.`id`, `Item`.`name`, `Item`.`code`' +
        ', (SELECT COUNT(*) `count` FROM `ItemTag` WHERE `ItemTag`.`itemId` = `Item`.`id`) `tagsCount`' +
        ', `measureUnit`.`id` `measureUnit.id`, `measureUnit`.`name` `measureUnit.name`, `measureUnit`.`categoryId` `measureUnit.categoryId`' +
        ', `measureUnit.category`.`id` `measureUnit.category.id`, `measureUnit.category`.`name` `measureUnit.category.name`' +
        ' FROM `Item` LEFT JOIN `MeasureUnit` `measureUnit` ON `measureUnit`.`id` = `Item`.`measureUnitId`' +
        ' LEFT JOIN `MeasureUnitCategory` `measureUnit.category` ON `measureUnit.category`.`id` = `measureUnit`.`categoryId`' +
        ' LIMIT ?'
    );
  }

  shouldFind$projectDeep() {
    expect(
      this.dialect.find(
        Item,
        {
          $limit: 100,
        },
        {
          id: 1,
          name: 1,
          code: 1,
          measureUnit: {
            $project: { id: 1, name: 1, categoryId: 1, category: ['name'] },
          },
        }
      )
    ).toBe(
      'SELECT `Item`.`id`, `Item`.`name`, `Item`.`code`' +
        ', `measureUnit`.`id` `measureUnit.id`' +
        ', `measureUnit`.`name` `measureUnit.name`, `measureUnit`.`categoryId` `measureUnit.categoryId`' +
        ', `measureUnit.category`.`id` `measureUnit.category.id`, `measureUnit.category`.`name` `measureUnit.category.name`' +
        ' FROM `Item` LEFT JOIN `MeasureUnit` `measureUnit` ON `measureUnit`.`id` = `Item`.`measureUnitId`' +
        ' LEFT JOIN `MeasureUnitCategory` `measureUnit.category` ON `measureUnit.category`.`id` = `measureUnit`.`categoryId`' +
        ' LIMIT ?'
    );

    expect(
      this.dialect.find(
        Item,
        {
          $limit: 100,
        },
        {
          id: true,
          name: true,
          code: true,
          measureUnit: {
            $project: { id: true, name: true, category: { $project: { id: true, name: true } } },
          },
        }
      )
    ).toBe(
      'SELECT `Item`.`id`, `Item`.`name`, `Item`.`code`, `measureUnit`.`id` `measureUnit.id`' +
        ', `measureUnit`.`name` `measureUnit.name`, `measureUnit.category`.`id` `measureUnit.category.id`' +
        ', `measureUnit.category`.`name` `measureUnit.category.name`' +
        ' FROM `Item` LEFT JOIN `MeasureUnit` `measureUnit` ON `measureUnit`.`id` = `Item`.`measureUnitId`' +
        ' LEFT JOIN `MeasureUnitCategory` `measureUnit.category` ON `measureUnit.category`.`id` = `measureUnit`.`categoryId`' +
        ' LIMIT ?'
    );

    expect(
      this.dialect.find(
        ItemAdjustment,
        {
          $limit: 100,
        },
        {
          id: true,
          buyPrice: true,
          number: true,
          item: {
            $project: {
              id: true,
              name: true,
              measureUnit: {
                $project: { id: true, name: true, category: ['id', 'name'] },
              },
            },
            $required: true,
          },
        }
      )
    ).toBe(
      'SELECT `ItemAdjustment`.`id`, `ItemAdjustment`.`buyPrice`, `ItemAdjustment`.`number`' +
        ', `item`.`id` `item.id`, `item`.`name` `item.name`' +
        ', `item.measureUnit`.`id` `item.measureUnit.id`, `item.measureUnit`.`name` `item.measureUnit.name`' +
        ', `item.measureUnit.category`.`id` `item.measureUnit.category.id`, `item.measureUnit.category`.`name` `item.measureUnit.category.name`' +
        ' FROM `ItemAdjustment`' +
        ' INNER JOIN `Item` `item` ON `item`.`id` = `ItemAdjustment`.`itemId`' +
        ' LEFT JOIN `MeasureUnit` `item.measureUnit` ON `item.measureUnit`.`id` = `item`.`measureUnitId`' +
        ' LEFT JOIN `MeasureUnitCategory` `item.measureUnit.category` ON `item.measureUnit.category`.`id` = `item.measureUnit`.`categoryId`' +
        ' LIMIT ?'
    );
  }

  shouldFind$group() {
    expect(
      this.dialect.find(User, {
        $group: ['companyId'],
      })
    ).toBe('SELECT `id`, `companyId`, `creatorId`, `createdAt`, `updatedAt`, `name`, `email`, `password` FROM `User` GROUP BY `companyId`');

    expect(
      this.dialect.find(
        User,
        {
          $group: ['companyId'],
          $having: {
            count: {
              $gte: 10,
            },
          } as QueryFilter<User>,
        },
        ['companyId', raw('COUNT(*)', 'count')]
      )
    ).toBe('SELECT `companyId`, COUNT(*) `count` FROM `User` GROUP BY `companyId` HAVING `count` >= ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { companyId: 1 },
          $group: ['companyId'],
          $skip: 50,
          $limit: 100,
          $sort: { name: 'desc' },
        },
        ['id', 'name']
      )
    ).toBe('SELECT `id`, `name` FROM `User` WHERE `companyId` = ? GROUP BY `companyId` ORDER BY `name` DESC LIMIT ? OFFSET ?');
  }

  shouldProject$count() {
    expect(
      this.dialect.find(
        User,
        {
          $group: ['companyId'],
          $having: {
            counting: {
              $gte: 10,
            },
          } as QueryFilter<User>,
        },
        {
          companyId: true,
          counting: { $count: 1 },
        }
      )
    ).toBe('SELECT `companyId`, COUNT(*) `counting` FROM `User` GROUP BY `companyId` HAVING `counting` >= ?');
  }

  shouldProject$max() {
    expect(
      this.dialect.find(
        User,
        {
          $group: ['companyId'],
          $having: {
            latest: {
              $gte: 10,
            },
          } as QueryFilter<User>,
        },
        {
          companyId: true,
          latest: { $max: 'createdAt' },
        }
      )
    ).toBe('SELECT `companyId`, MAX(`createdAt`) `latest` FROM `User` GROUP BY `companyId` HAVING `latest` >= ?');
  }

  shouldProject$min() {
    expect(
      this.dialect.find(
        User,
        {
          $group: ['companyId'],
          $having: {
            minimum: {
              $gte: 10,
            },
          } as QueryFilter<User>,
        },
        {
          companyId: true,
          minimum: { $min: 'updatedAt' },
        }
      )
    ).toBe('SELECT `companyId`, MIN(`updatedAt`) `minimum` FROM `User` GROUP BY `companyId` HAVING `minimum` >= ?');
  }

  shouldProject$avg() {
    expect(
      this.dialect.find(
        User,
        {
          $group: ['companyId'],
          $having: {
            average: {
              $gte: 10,
            },
          } as QueryFilter<User>,
        },
        {
          companyId: true,
          average: { $avg: 'createdAt' },
        }
      )
    ).toBe('SELECT `companyId`, AVG(`createdAt`) `average` FROM `User` GROUP BY `companyId` HAVING `average` >= ?');
  }

  shouldProject$sum() {
    expect(
      this.dialect.find(
        Item,
        {
          $group: ['creatorId'],
          $having: {
            total: {
              $lt: 100,
            },
          },
        },
        {
          creatorId: true,
          total: { $sum: 'salePrice' },
        }
      )
    ).toBe('SELECT `creatorId`, SUM(`salePrice`) `total` FROM `Item` GROUP BY `creatorId` HAVING `total` < ?');

    expect(
      this.dialect.find(
        Item,
        {
          $filter: { $or: [[1, 2], { code: 'abc' }] },
          $group: ['creatorId'],
          $having: {
            total: {
              $gte: 1000,
            },
          },
        },
        {
          creatorId: true,
          total: {
            $sum: 'salePrice',
          },
        }
      )
    ).toBe('SELECT `creatorId`, SUM(`salePrice`) `total` FROM `Item` WHERE `id` IN (?) OR `code` = ? GROUP BY `creatorId` HAVING `total` >= ?');

    // TODO support this
    // expect(
    //   this.dialect.find(ItemAdjustment, {
    //     $project: {
    //       item: {
    //         $project: {
    //           companyId: true,
    //           total: {
    //             $sum: 'salePrice',
    //           },
    //         },
    //         $required: true,
    //       },
    //     },
    //     $group: ['companyId'],
    //   })
    // ).toBe(
    //   'SELECT `ItemAdjustment`.`id`, `item`.`id` `item.id`, `item`.`companyId` `item.companyId`, SUM(`item`.`salePrice`) `item.total`' +
    //     ' FROM `ItemAdjustment` INNER JOIN `Item` `item` ON `item`.`id` = `ItemAdjustment`.`itemId` GROUP BY `companyId`'
    // );
  }

  shouldFind$limit() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: 9,
          $limit: 1,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `id` = ? LIMIT ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: 9,
          $limit: 1,
        },
        { id: 1, name: 1, creatorId: 1 }
      )
    ).toBe('SELECT `id`, `name`, `creatorId` FROM `User` WHERE `id` = ? LIMIT ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: 'something', creatorId: 123 },
          $limit: 1,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `name` = ? AND `creatorId` = ? LIMIT ?');

    expect(
      this.dialect.find(
        User,
        {
          $limit: 25,
        },
        ['id', 'name', 'creatorId']
      )
    ).toBe('SELECT `id`, `name`, `creatorId` FROM `User` LIMIT 25');
  }

  shouldFind$skip() {
    expect(
      this.dialect.find(
        User,
        {
          $skip: 30,
        },
        { id: 1, name: 1, creatorId: 1 }
      )
    ).toBe('SELECT `id`, `name`, `creatorId` FROM `User` OFFSET 30');
  }

  shouldFind$project() {
    expect(this.dialect.find(User, {}, { password: false })).toBe(
      'SELECT `id`, `companyId`, `creatorId`, `createdAt`, `updatedAt`, `name`, `email` FROM `User`'
    );

    expect(this.dialect.find(User, {}, { name: 0, password: 0 })).toBe(
      'SELECT `id`, `companyId`, `creatorId`, `createdAt`, `updatedAt`, `email` FROM `User`'
    );

    expect(this.dialect.find(User, {}, { id: 1, name: 1, password: 0 })).toBe('SELECT `id`, `name` FROM `User`');

    expect(this.dialect.find(User, {}, { id: 1, name: 0, password: 0 })).toBe('SELECT `id` FROM `User`');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: 'something' },
        },
        [raw('*'), raw('LOG10(numberOfVotes + 1) * 287014.5873982681 + createdAt', 'hotness')]
      )
    ).toBe('SELECT *, LOG10(numberOfVotes + 1) * 287014.5873982681 + createdAt `hotness` FROM `User` WHERE `name` = ?');
  }

  shouldDelete() {
    expect(this.dialect.delete(User, { $filter: 123 })).toBe('DELETE FROM `User` WHERE `id` = ?');
    expect(() => this.dialect.delete(User, { $filter: 123 }, { softDelete: true })).toThrow("'User' has not enabled 'softDelete'");
    expect(this.dialect.delete(User, { $filter: 123 }, { softDelete: false })).toBe('DELETE FROM `User` WHERE `id` = ?');
    expect(this.dialect.delete(MeasureUnit, { $filter: 123 })).toBe(
      'UPDATE `MeasureUnit` SET `deletedAt` = ? WHERE `id` = ? AND `deletedAt` IS NULL'
    );
    expect(this.dialect.delete(MeasureUnit, { $filter: 123 }, { softDelete: true })).toBe(
      'UPDATE `MeasureUnit` SET `deletedAt` = ? WHERE `id` = ? AND `deletedAt` IS NULL'
    );
    expect(this.dialect.delete(MeasureUnit, { $filter: 123 }, { softDelete: false })).toBe('DELETE FROM `MeasureUnit` WHERE `id` = ?');
  }

  shouldFind$projectRaw() {
    expect(
      this.dialect.find(
        Item,
        {
          $group: ['companyId'],
        },
        {
          companyId: true,
          total: raw(({ escapedPrefix, dialect }) => `SUM(${escapedPrefix}${dialect.escapeId('salePrice')})`),
        }
      )
    ).toBe('SELECT `companyId`, SUM(`salePrice`) `total` FROM `Item` GROUP BY `companyId`');

    expect(
      this.dialect.find(
        ItemAdjustment,
        {
          $group: ['companyId'],
        },
        {
          item: {
            $project: {
              companyId: true,
              total: raw(({ escapedPrefix, dialect }) => `SUM(${escapedPrefix}${dialect.escapeId('salePrice')})`),
            },
            $required: true,
          },
        }
      )
    ).toBe(
      'SELECT `ItemAdjustment`.`id`, `item`.`id` `item.id`, `item`.`companyId` `item.companyId`, SUM(`item`.`salePrice`) `item.total`' +
        ' FROM `ItemAdjustment` INNER JOIN `Item` `item` ON `item`.`id` = `ItemAdjustment`.`itemId` GROUP BY `companyId`'
    );

    expect(
      this.dialect.find(
        User,
        {
          $group: ['companyId'],
          $having: {
            count: {
              $gte: 10,
            },
          } as QueryFilter<User>,
        },
        ['companyId', raw('COUNT(*)', 'count')]
      )
    ).toBe('SELECT `companyId`, COUNT(*) `count` FROM `User` GROUP BY `companyId` HAVING `count` >= ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: 'something' },
        },
        [raw(() => 'createdAt', 'hotness')]
      )
    ).toBe('SELECT createdAt `hotness` FROM `User` WHERE `name` = ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: 'something' },
        },
        [raw('*'), raw('LOG10(numberOfVotes + 1) * 287014.5873982681 + createdAt', 'hotness')]
      )
    ).toBe('SELECT *, LOG10(numberOfVotes + 1) * 287014.5873982681 + createdAt `hotness` FROM `User` WHERE `name` = ?');
  }

  shouldFind$filterRaw() {
    expect(
      this.dialect.find(
        Item,
        {
          $filter: { $and: [{ companyId: 1 }, raw('SUM(salePrice) > 500')] },
          $group: ['creatorId'],
        },
        ['creatorId']
      )
    ).toBe('SELECT `creatorId` FROM `Item` WHERE `companyId` = ? AND SUM(salePrice) > 500 GROUP BY `creatorId`');

    expect(
      this.dialect.find(
        Item,
        {
          $filter: { $or: [{ companyId: 1 }, 5, raw('SUM(salePrice) > 500')] },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `Item` WHERE `companyId` = ? OR `id` = 5 OR SUM(salePrice) > 500');

    expect(
      this.dialect.find(
        Item,
        {
          $filter: { $and: [raw('SUM(`salePrice`) > 500')] },
          $group: ['companyId'],
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `Item` WHERE SUM(`salePrice`) > 500 GROUP BY `companyId`');

    expect(
      this.dialect.find(
        Item,
        {
          $filter: { $or: [1, raw('SUM(salePrice) > 500')] },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `Item` WHERE `id` = 1 OR SUM(salePrice) > 500');

    expect(
      this.dialect.find(
        Item,
        {
          $filter: { $or: [raw('SUM(salePrice) > 500'), 1, { companyId: 1 }] },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `Item` WHERE SUM(salePrice) > 500 OR `id` = 1 OR `companyId` = ?');

    expect(
      this.dialect.find(
        Item,
        {
          $filter: { $and: [raw('SUM(salePrice) > 500')] },
          $group: ['creatorId'],
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `Item` WHERE SUM(salePrice) > 500 GROUP BY `creatorId`');

    expect(
      this.dialect.find(
        Item,
        {
          $filter: raw('SUM(salePrice) > 500'),
          $group: ['creatorId'],
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `Item` WHERE SUM(salePrice) > 500 GROUP BY `creatorId`');

    expect(
      this.dialect.find(
        Item,
        {
          $filter: { $or: [[1, 2], { code: 'abc' }] },
          $group: ['creatorId'],
        },
        ['creatorId']
      )
    ).toBe('SELECT `creatorId` FROM `Item` WHERE `id` IN (1, 2) OR `code` = ? GROUP BY `creatorId`');
  }

  shouldFind$startsWith() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $startsWith: 'Some' } },
          $sort: [
            { field: 'name', sort: 'asc' },
            { field: 'createdAt', sort: 'desc' },
          ],
          $skip: 0,
          $limit: 50,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `name` LIKE ? ORDER BY `name`, `createdAt` DESC LIMIT ? OFFSET ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $startsWith: 'Some', $ne: 'Something' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        { id: true }
      )
    ).toBe('SELECT `id` FROM `User` WHERE (`name` LIKE ? AND `name` <> ?) ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');
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
    ).toBe('SELECT `id` FROM `User` WHERE LOWER(`name`) LIKE ? ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');

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
    ).toBe('SELECT `id` FROM `User` WHERE (LOWER(`name`) LIKE ? AND `name` <> ?) ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');
  }

  shouldFind$endsWith() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $endsWith: 'Some' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `name` LIKE ? ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $endsWith: 'Some', $ne: 'Something' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE (`name` LIKE ? AND `name` <> ?) ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');
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
    ).toBe('SELECT `id` FROM `User` WHERE LOWER(`name`) LIKE ? ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $iendsWith: 'Some', $ne: 'Something' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE (LOWER(`name`) LIKE ? AND `name` <> ?) ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');
  }

  shouldFind$includes() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $includes: 'Some' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `name` LIKE ? ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $includes: 'Some', $ne: 'Something' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE (`name` LIKE ? AND `name` <> ?) ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');
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
    ).toBe('SELECT `id` FROM `User` WHERE LOWER(`name`) LIKE ? ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $iincludes: 'Some', $ne: 'Something' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE (LOWER(`name`) LIKE ? AND `name` <> ?) ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');
  }

  shouldFind$like() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $like: 'Some' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `name` LIKE ? ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');

    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $like: 'Some', $ne: 'Something' } },
          $sort: { name: 1, id: -1 },
          $skip: 0,
          $limit: 50,
        },
        { id: true }
      )
    ).toBe('SELECT `id` FROM `User` WHERE (`name` LIKE ? AND `name` <> ?) ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');
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
    ).toBe('SELECT `id` FROM `User` WHERE LOWER(`name`) LIKE ? ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');

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
    ).toBe('SELECT `id` FROM `User` WHERE (LOWER(`name`) LIKE ? AND `name` <> ?) ORDER BY `name`, `id` DESC LIMIT ? OFFSET ?');
  }

  shouldFind$regex() {
    expect(
      this.dialect.find(
        User,
        {
          $filter: { name: { $regex: '^some' } },
        },
        ['id']
      )
    ).toBe('SELECT `id` FROM `User` WHERE `name` REGEXP ?');
  }

  shouldFind$text() {
    expect(
      this.dialect.find(
        Item,
        {
          $filter: { $text: { $fields: ['name', 'description'], $value: 'some text' }, companyId: 1 },
          $limit: 30,
        },
        { id: true }
      )
    ).toBe('SELECT `id` FROM `Item` WHERE MATCH(`name`, `description`) AGAINST(?) AND `companyId` = ? LIMIT ?');

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
    ).toBe("SELECT `id` FROM `User` WHERE MATCH(`name`) AGAINST('something') AND `name` <> ? AND `companyId` = ? LIMIT ?");
  }
}
