import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('inventory_items')
export class InventoryItems {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ nullable: true })
  name?: string;

  @Column()
  price?: number;
}

// CREATE TABLE public.inventory_items (
// 	id serial4 NOT NULL,
// 	"name" varchar(255) NOT NULL,
// 	price int4 NOT NULL,
// 	CONSTRAINT inventory_items_pkey PRIMARY KEY (id)
// );
