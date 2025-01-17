import { BigNumber } from "ethers";
import { getAddress } from "ethers/lib/utils";

import { post } from "../../utils";
import { isNetworkSupported } from "../network";
import {
  ApiKey,
  BaseRelayParams,
  Config,
  RelayCall,
  RelayRequestOptions,
  RelayResponse,
} from "../types";

import { SponsoredCallRequest } from "./types";

export const relayWithSponsoredCall = async (
  payload: {
    request: SponsoredCallRequest;
    sponsorApiKey: string;
    options?: RelayRequestOptions;
  },
  config: Config
): Promise<RelayResponse> => {
  return await sponsoredCall(payload, config);
};

const mapRequestToStruct = async (
  request: SponsoredCallRequest
): Promise<BaseRelayParams> => {
  return {
    chainId: BigNumber.from(request.chainId).toString(),
    target: getAddress(request.target as string),
    data: request.data,
  };
};

const sponsoredCall = async (
  payload: {
    request: SponsoredCallRequest;
    sponsorApiKey: string;
    options?: RelayRequestOptions;
  },
  config: Config
): Promise<RelayResponse> => {
  try {
    const { request, sponsorApiKey, options } = payload;
    const isSupported = await isNetworkSupported(
      { chainId: Number(request.chainId) },
      config
    );
    if (!isSupported) {
      throw new Error(`Chain id [${request.chainId}] is not supported`);
    }
    const struct = await mapRequestToStruct(request);
    const postResponse = await post<
      BaseRelayParams & RelayRequestOptions & ApiKey,
      RelayResponse
    >(
      {
        relayCall: RelayCall.SponsoredCall,
        request: {
          ...struct,
          ...options,
          sponsorApiKey,
        },
      },
      config
    );
    return postResponse;
  } catch (error) {
    const errorMessage = (error as Error).message;
    throw new Error(
      `GelatoRelaySDK/sponsoredCall: Failed with error: ${errorMessage}`
    );
  }
};
