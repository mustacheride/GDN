import axios from 'axios';

import { GDN_API_TOKEN } from './constants';

export interface APIGuild {
  'server_id': string;
  'name': string;
  'description': string;
  'user_count': number;
  'invite_url': string;
  'icon_url'?: string;
  'validated_role_id'?: string;
  'logging_channel_id'?: string;
}

export interface APIGuildUpdate {
  'name'?: string;
  'description'?: string;
  'invite_url'?: string;
}

export interface APIGuildAuthme {
  'validated_role_id': string;
  'logging_channel_id': string;
}

export interface APIMember {
  'discord_id': string;
  'sa_id': string;
  'sa_username': string;
  'blacklisted': boolean;
}

/**
 * An instance of Axios configured to speak with the GDN APIs over Docker's internal network
 */
export const axiosGDN = axios.create({
  baseURL: 'http://gdn',
  headers: {
    Authorization: `Token ${GDN_API_TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const GDN_URLS = {
  MEMBERS: '/gdn/members',
  GUILDS: '/gdn/servers',
  SA: '/gdn/sa',
};
