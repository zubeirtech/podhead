import {Injectable, Logger} from "@nestjs/common";
import {ElasticsearchService} from "@nestjs/elasticsearch";
import {ChannelSchema} from "./channel.schema";
import { Channel } from "../interfaces/channel.interface";
import IChannelStorage from "../interfaces/channel-storage.inteface";
import {generateId} from "../../utils";
import { ChannelDto } from "../interfaces/channel.dto";
import {SearchResponse} from "../../types/searchResponse.interface";

@Injectable()
export default class ChannelStorage implements IChannelStorage {
    indexName: string;

    constructor(private readonly client: ElasticsearchService) {
        this.indexName = "channel";
    }

    public async getChannels(accountId: number): Promise<Channel[]> {
        try {
            const res = await this.client.search({
                index: this.indexName,
                body: {
                    query: {
                        match: {accountId}
                    }
                }
            });
            return ChannelStorage.mapData(res.body.hits.hits);
        } catch(e) {
            Logger.log(e.body.error);
            throw e;
        }
    }

    public async createDocument(payload: ChannelDto): Promise<void> {
        const exists = await this.checkIfIndexExists();
        if(!exists) {
            await this.createIndex();
        }
        try {
            await this.client.index({
                index: this.indexName,
                op_type: "create",
                id: generateId(),
                body: payload
            })
        } catch(e) {
            Logger.log(e.body.error);
            throw e;
        }
    }

    async checkIfIndexExists(): Promise<boolean> {
        const res = await this.client.indices.exists({index: this.indexName});
        return res.statusCode !== 404;
    }

    async createIndex(): Promise<void> {
        try {
            await this.client.indices.create(ChannelSchema)
        } catch (e) {
            Logger.error(e.body.error);
        }
    }

    private static mapData(data: Array<SearchResponse>): Channel[] {
        return data.map(channel => {
            return {
                id: channel._id,
                ...channel._source
            }
        })
    }

}