import * as Decoder from 'io-ts/Decoder';
import { Speaker } from './types/speaker';
import { Talk } from './types/talk';

export const talkDecoder = Decoder.struct<Talk>({
  abstract: Decoder.string,
  category: Decoder.union(
    Decoder.literal('languages'),
    Decoder.literal('agile'),
    Decoder.literal('web'),
    Decoder.literal('data'),
    Decoder.literal('mobile'),
    Decoder.literal('cloud'),
    Decoder.literal('architecture'),
  ),
  format: Decoder.union(
    Decoder.literal('conference'),
    Decoder.literal('workshop'),
    Decoder.literal('quickies'),
  ),
  speaker: Decoder.struct<Speaker>({
    email: Decoder.string,
    firstName: Decoder.string,
    lastName: Decoder.string,
  }),
  status: Decoder.union(
    Decoder.literal('submitted'),
    Decoder.literal('accepted'),
    Decoder.literal('rejected'),
  ),
  title: Decoder.string,
});
