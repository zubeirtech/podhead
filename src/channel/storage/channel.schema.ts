export const ChannelSchema = {
    index: 'channel',
    body: {
        settings: {
            analysis: {
                analyzer: {
                    autocomplete_analyzer: {
                        tokenizer: 'autocomplete',
                        filter: ['lowercase'],
                    },
                    autocomplete_search_analyzer: {
                        tokenizer: 'keyword',
                        filter: ['lowercase'],
                    },
                },
                tokenizer: {
                    autocomplete: {
                        type: 'edge_ngram',
                        min_gram: 1,
                        max_gram: 30,
                        token_chars: ['letter', 'digit', 'whitespace'],
                    },
                },
            }
        },
        mappings: {
            properties: {
                accountId: { type: 'text'},
                channelImageUrl: { type: 'text'},
                channelName: {
                    type: 'text',
                    fields: {
                        complete: {
                            type: 'text',
                            analyzer: 'autocomplete_analyzer',
                            search_analyzer: 'autocomplete_search_analyzer'
                        }
                    }
                },
                channelDescription: {
                    type: 'text',
                    fields: {
                        complete: {
                            type: 'text',
                            analyzer: 'autocomplete_analyzer',
                            search_analyzer: 'autocomplete_search_analyzer'
                        }
                    }
                },
                channelUrl: { type: 'text' },
                language: { type: 'text' },
                category: { type: 'text' },
                createdAt: { type: 'date'},
                updatedAt: { type: 'date'}
            }
        }
    }
}