import { Injectable } from '@nestjs/common';
import * as RSS from 'rss';
import * as dotenv from 'dotenv';
import { Episode } from 'src/episode/interfaces/episode.interface';
import { Channel } from 'src/channel/interfaces/channel.interface';
import { IFeedService } from './interfaces/feed-service.interface';
import { Feed } from './interfaces/feed.interface';
import { Account } from '../account/interfaces/account.interface';
import { FeedStorage } from './storage/feed.storage';

dotenv.config();

@Injectable()
export class FeedService implements IFeedService {

    constructor(private readonly feedStorage: FeedStorage) {
    }

    mapChannelToFeed(channel: Channel, account: Account, currentFeed?: Feed): Feed {
        return {
            channelId: channel.id,
            title: channel.channelName,
            description: channel.channelDescription,
            feed_url: `${process.env.CLIENT_URL}/channel/${channel.id}/feed.xml`,
            site_url: `${process.env.CLIENT_URL}/channel/${channel.id}`,
            image_url: channel.channelImageUrl,
            generator: process.env.CLIENT_URL,
            language: channel.language,
            copyright: 'Copyright 2019 All rights reserved.',
            pubDate: currentFeed ? currentFeed.createdAt : new Date(),
            custom_elements: [
                { 'itunes:type': 'episodic' },
                { 'itunes:summary': channel.channelDescription },
                { 'itunes:author': account.username },
                {
                    'itunes:owner': [
                        { 'itunes:name': account.firstName + account.lastName },
                        { 'itunes:email': account.email },
                    ],
                },
                {
                    'itunes:image': { _attr: { href: channel.channelImageUrl } },
                },
                {
                    'itunes:category': channel.category.map(category => {
                        return {
                            _attr: {
                                text: category
                            }
                        }
                    })
                },
            ],
            items: currentFeed ? currentFeed.items :  []
        };
    }

    addEpisode(feed: Feed, episode: Episode, image: string): Feed {
        return {
            ...feed,
            items: [...feed.items, {
                title: episode.title,
                description: episode.description,
                pubDate: episode.publishedAt,
                enclosure: {
                    url: episode.mediaUrl,
                    length: episode.size,
                    type: "audio/mpeg"
                },
                custom_elements: [
                    {
                        'itunes:subtitle': episode.description,
                        'itunes:summary': episode.description,
                        'itunes:author': episode.author,
                        'itunes:explicit': "No",
                        'itunes:duration': episode.length,
                        'itunes:episodeType': "full",
                        'media:content': {
                            _attr: {
                                url: image,
                                medium: "image"
                            },
                            'media:title': episode.title
                        }
                    }
                ]
            }]
        };
    }

    private static setupRss(feed: Feed) {
        return new RSS(feed);
    }

    async getFeed(channelId: string): Promise<Feed> {
        return this.feedStorage.getFeed(channelId);
    }

    async createChannelFeed(channel: Channel, account: Account): Promise<void> {
        const newFeed = this.mapChannelToFeed(channel, account);
        await this.feedStorage.createDocument(newFeed);
    }

    async updateFeed(channelId: string, feed: Feed): Promise<void> {
        await this.feedStorage.updateFeed(channelId, feed);
    }
}
