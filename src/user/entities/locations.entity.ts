import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('locations')
export class LocationsEntity {
  @PrimaryGeneratedColumn()
  location: string;

  @Column({ nullable: true })
  image?: string;
}
