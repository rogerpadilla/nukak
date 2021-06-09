import { v4 as uuidv4 } from 'uuid';
import { Property, ManyToOne, Id, OneToMany, Entity, OneToOne, ManyToMany } from '../entity/decorator';

/**
 * interfaces can (optionally) be used to avoid circular-reference issue between entities
 */
export interface IEntity {
  id?: number;
  companyId?: number;
  company?: ICompany;
  creatorId?: number;
  creator?: IUser;
  createdAt?: number;
  updatedAt?: number;
}
interface ICompany extends IEntity {
  name?: string;
  description?: string;
}

interface IUser extends IEntity {
  name?: string;
  email?: string;
  password?: string;
  profile?: Profile;
}

/**
 * an abstract class can (optionally) be used as a "template" for the entities
 * (so the common attributes' declaration is reused)
 */
export abstract class BaseEntity implements IEntity {
  @Id()
  id?: number;
  /**
   * foreign-keys are really simple to specify
   */
  @Property({ reference: () => Company })
  companyId?: number;
  @ManyToOne({ entity: () => Company })
  company?: ICompany;
  @Property({ reference: () => User })
  creatorId?: number;
  @ManyToOne({ entity: () => User })
  creator?: IUser;
  /**
   * 'onInsert' callback can be used to specify a custom mechanism for
   * obtaining the value of a property when inserting:
   */
  @Property({ onInsert: () => Date.now() })
  createdAt?: number;
  /**
   * 'onUpdate' callback can be used to specify a custom mechanism for
   * obtaining the value of a property when updating:
   */
  @Property({ onUpdate: () => Date.now() })
  updatedAt?: number;
}

@Entity()
export class Company extends BaseEntity implements ICompany {
  @Property()
  name?: string;
  @Property()
  description?: string;
}

/**
 * and entity can specify the table name
 */
@Entity({ name: 'user_profile' })
export class Profile extends BaseEntity {
  /**
   * an entity can specify its own ID Property and still inherit the others
   * columns/relations from its parent entity.
   * 'onInsert' callback can be used to specify a custom mechanism for
   * auto-generating the primary-key's value when inserting
   */
  @Id({ name: 'pk' })
  id?: number;
  @Property({ name: 'image' })
  picture?: string;
  @OneToOne({ entity: () => User })
  creator?: IUser;
}

@Entity()
export class User extends BaseEntity implements IUser {
  @Property()
  name?: string;
  @Property()
  email?: string;
  @Property()
  password?: string;
  /**
   * `mappedBy` can be a callback or a string (callback is useful for auto-refactoring)
   */
  @OneToOne({ entity: () => Profile, mappedBy: (profile) => profile.creator })
  profile?: Profile;
  @OneToMany({ entity: () => User, mappedBy: 'creator' })
  users?: User[];
}

@Entity()
export class LedgerAccount extends BaseEntity {
  @Property()
  name?: string;
  @Property()
  description?: string;
  @Property({ reference: () => LedgerAccount })
  parentLedgerId?: number;
  @ManyToOne()
  parentLedger?: LedgerAccount;
}

@Entity()
export class TaxCategory extends BaseEntity {
  /**
   * an entity can specify its own ID Property and still inherit the others
   * columns/relations from its parent entity.
   * 'onInsert' callback can be used to specify a custom mechanism for
   * auto-generating the primary-key's value when inserting
   */
  @Id({ onInsert: () => uuidv4() })
  pk?: string;
  @Property()
  name?: string;
  @Property()
  description?: string;
}

@Entity()
export class Tax extends BaseEntity {
  @Property()
  name?: string;
  @Property()
  percentage?: number;
  @Property({ reference: () => TaxCategory })
  categoryId?: string;
  @ManyToOne()
  category?: TaxCategory;
  @Property()
  description?: string;
}

@Entity()
export class MeasureUnitCategory extends BaseEntity {
  @Property()
  name?: string;
}

@Entity()
export class MeasureUnit extends BaseEntity {
  @Property()
  name?: string;
  @Property({ reference: () => MeasureUnitCategory })
  categoryId?: number;
  @ManyToOne()
  category?: MeasureUnitCategory;
}

@Entity()
export class Storehouse extends BaseEntity {
  @Property()
  name?: string;
  @Property()
  address?: string;
  @Property()
  description?: string;
}

@Entity()
export class Item extends BaseEntity {
  @Property()
  name?: string;
  @Property()
  description?: string;
  @Property()
  code?: string;
  @Property({ reference: () => LedgerAccount })
  buyLedgerAccountId?: number;
  @ManyToOne()
  buyLedgerAccount?: LedgerAccount;
  @Property({ reference: () => LedgerAccount })
  saleLedgerAccountId?: number;
  @ManyToOne()
  saleLedgerAccount?: LedgerAccount;
  @Property({ reference: { entity: () => Tax } })
  taxId?: number;
  @ManyToOne()
  tax?: Tax;
  @Property({ reference: () => MeasureUnit })
  measureUnitId?: number;
  @ManyToOne()
  measureUnit?: MeasureUnit;
  @Property()
  salePrice?: number;
  @Property()
  inventoryable?: boolean;
  @ManyToMany({ entity: () => Tag, through: () => ItemTag })
  tags?: Tag[];
}

@Entity()
export class Tag extends BaseEntity {
  @Property()
  name?: string;
  @ManyToMany({ entity: () => Item, mappedBy: (item) => item.tags })
  items?: Item[];
}

@Entity()
export class ItemTag {
  @Id()
  id?: number;
  @Property({ reference: () => Item })
  itemId?: number;
  @Property({ reference: () => Tag })
  tagId?: number;
}

@Entity()
export class ItemAdjustment extends BaseEntity {
  @Property({ reference: () => Item })
  itemId?: number;
  @ManyToOne()
  item?: Item;
  @Property()
  number?: number;
  @Property()
  buyPrice?: number;
  @Property({ reference: () => Storehouse })
  storehouseId?: number;
  @ManyToOne()
  storehouse?: Storehouse;
  @Property({ reference: () => InventoryAdjustment })
  inventoryAdjustmentId?: number;
}

@Entity()
export class InventoryAdjustment extends BaseEntity {
  @OneToMany({
    entity: () => ItemAdjustment,
    mappedBy: (rel) => rel.inventoryAdjustmentId,
  })
  itemAdjustments?: ItemAdjustment[];
  @Property()
  date?: number;
  @Property()
  description?: string;
}
