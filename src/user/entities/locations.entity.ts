import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('locations')
export class LocationsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  image?: string;
}
