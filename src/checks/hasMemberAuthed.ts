import { GuildMember } from 'discord.js';

import logger, { LogTag } from '../helpers/logger';
import { GDN_URLS, axiosGDN, APIMember } from '../helpers/axiosGDN';

interface MemberAuthed {
  hasAuthed: boolean;
  memberData?: APIMember;
}

/**
 * Check to see if the Discord member has authed before
 */
export default async function hasMemberAuthed (
  tag: LogTag,
  member: GuildMember,
): Promise<MemberAuthed> {
  logger.info(tag, 'Checking to see if Member has authed before');

  const { id } = member;

  try {
    // No error here means the user exists in the DB
    const { data: memberData } = await axiosGDN.get<APIMember>(`${GDN_URLS.MEMBERS}/${id}`);
    logger.info(tag, 'Member has authed before');
    return {
      hasAuthed: true,
      memberData,
    };
  } catch (err) {
    const { response } = err;

    if (response?.status === 404) {
      logger.warn(tag, 'Member has not authed before');
      return {
        hasAuthed: false,
      };
    }

    logger.error({ ...tag, err }, 'Error checking if member has authed');
    throw err;
  }
}
