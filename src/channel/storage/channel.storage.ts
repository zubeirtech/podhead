import {Injectable, Logger} from "@nestjs/common";
import {ElasticsearchService} from "@nestjs/elasticsearch";
import {ChannelSchema} from "./channel.schema";
import { Channel } from "../interfaces/channel.interface";
import IChannelStorage from "../interfaces/channel-storage.inteface";
import {generateId} from "../../utils";
import { ChannelDto } from "../interfaces/channel.dto";
import {SearchResponse} from "../../types/searchResponse.interface";
import { FeedService } from '../../feed/feed.service';
import { Account } from '../../account/interfaces/account.interface';

@Injectable()
export default class ChannelStorage implements IChannelStorage {
    indexName: string;

    constructor(private readonly client: ElasticsearchService, private readonly feedService: FeedService) {
        this.indexName = "channel";
    }

    public async getChannel(channelId: number): Promise<Channel> {
        try {
            const res = await this.client.get({
                index: this.indexName,
                id: channelId.toString()
            });
            return ChannelStorage.mapData(res.body);
        } catch(e) {
            Logger.log(e.body.error);
            throw e;
        }
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
            return ChannelStorage.mapDataCollection(res.body.hits.hits);
        } catch(e) {
            Logger.log(e.body.error);
            throw e;
        }
    }

    public async createDocument(payload: ChannelDto, account: Account): Promise<void> {
        const exists = await this.checkIfIndexExists();
        if(!exists) {
            await this.createIndex();
        }
        try {
            const id = generateId();
            const body = { id, ...payload, createdAt: new Date(), updatedAt: new Date()}
            const channelFeed = this.feedService.createChannelFeed(body, account);
            const channel = {...payload, feed: channelFeed}
            await this.client.index({
                index: this.indexName,
                op_type: "create",
                id: id.toString(),
                body: channel
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

    private static mapDataCollection(data: Array<SearchResponse>): Channel[] {
        return data.map(channel => {
            return {
                id: channel._id,
                ...channel._source
            }
        })
    }

    private static mapData(data): Channel {
        return { id: data._id, ...data._source }
    }

}