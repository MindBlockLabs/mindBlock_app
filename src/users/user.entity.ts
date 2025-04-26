import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/** this is the structure of the users table */ 
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", {length: 90, nullable: false})
    firstname: string;

    @Column("varchar", {length: 90, nullable: true})
    lastname: string;

    @Column("varchar", {length: 150, nullable: false, unique: true})
    email: string;

    @Column("varchar", {length: 225, nullable: false})
    password: string;

}