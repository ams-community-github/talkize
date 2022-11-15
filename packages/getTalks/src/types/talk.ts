import { Speaker } from './speaker';
import { TalkCategory } from './talkCategory';
import { TalkFormat } from './talkFormat';
import { TalkStatus } from './talkStatus';

export type Talk = {
  title: string;
  abstract: string;
  speaker: Speaker;
  category: TalkCategory;
  format: TalkFormat;
  status: TalkStatus;
};
