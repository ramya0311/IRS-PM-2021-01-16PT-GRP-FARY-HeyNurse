import { DataContract, dateSerialization, Serializable } from './resource';


export class User extends DataContract{
    @Serializable() _id: string;
    @Serializable() user_name: string;
    @Serializable() user_id: string;
    @Serializable() isAdmin: boolean;
    @Serializable() isActivated: boolean;
    @Serializable() email: string;
    @Serializable(dateSerialization) expireDate: Date;
    @Serializable() access_token: string;
    expires_at: number;
    constructor(fields?: any) {
        super(fields);
     }

}
