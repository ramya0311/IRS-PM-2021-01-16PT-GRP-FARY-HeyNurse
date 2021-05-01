import { DataContract, dateSerialization, Serializable } from './resource';

// define variables to store and display data
export class Request extends DataContract{
    @Serializable() _id: string;
    @Serializable() req_class: string;
    @Serializable() req_datetime: string;
    @Serializable() req_src_ward: string;
    @Serializable() req_src_room: string;
    @Serializable() req_src_bed: string;
    @Serializable() req_message: string;
    @Serializable() req_status: string;
    @Serializable() req_nurse_id: string;
    @Serializable() req_start_datetime: string;
    @Serializable() req_end_datetime: string;
    @Serializable() highlight_flag: number;
    constructor(fields?: any) {
        super(fields);
     }
}
