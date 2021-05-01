export interface QueryResponse {
    total: number;
    limit: number;
    offset: number;
    data: Array<any>;
}

export class RESTQueryResult<TModel> {
    static empty: RESTQueryResult<any> = new RESTQueryResult(
        {
            total: 0,
            data: [],
            limit: 20,
            offset: 0,
        },
        d => ({})
    );

    total: number;
    limit: number;
    offset: number;
    data: Array<TModel>;

    constructor(response: QueryResponse, createInstance: (m: any) => TModel) {
        this.total = response.total;
        this.limit = response.limit;
        this.offset = response.offset;
        this.data = (response.data || []).map(d => createInstance(d));
    }
}
