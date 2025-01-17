import { ethers } from "ethers";

import {
  getProviderChainId,
  isWallet,
  populateOptionalUserParameters,
  signTypedDataV4,
} from "../../../utils";
import { isNetworkSupported } from "../../network";
import { Config } from "../../types";
import {
  SignatureData,
  CallWithERC2771Request,
  CallWithERC2771RequestOptionalParameters,
  ERC2771Type,
} from "../types";
import { getPayloadToSign, mapRequestToStruct } from "../utils";

export const getSignatureDataERC2771 = async (
  payload: {
    request: CallWithERC2771Request;
    walletOrProvider: ethers.providers.Web3Provider | ethers.Wallet;
    type: ERC2771Type;
  },
  config: Config
): Promise<SignatureData> => {
  try {
    const { request, type, walletOrProvider } = payload;
    if (!walletOrProvider.provider) {
      throw new Error(`Missing provider`);
    }

    const chainId = Number(request.chainId);
    const isSupported = await isNetworkSupported({ chainId }, config);
    if (!isSupported) {
      throw new Error(`Chain id [${request.chainId}] is not supported`);
    }

    const providerChainId = await getProviderChainId(walletOrProvider);
    if (chainId !== providerChainId) {
      throw new Error(
        `Request and provider chain id mismatch. Request: [${chainId}], provider: [${providerChainId}]`
      );
    }

    const parametersToOverride = await populateOptionalUserParameters<
      CallWithERC2771Request,
      CallWithERC2771RequestOptionalParameters
    >({ request, type, walletOrProvider }, config);

    const struct = await mapRequestToStruct(request, parametersToOverride);

    const signature = await signTypedDataV4(
      walletOrProvider,
      request.user as string,
      getPayloadToSign(
        { struct, type, isWallet: isWallet(walletOrProvider) },
        config
      )
    );

    return {
      struct,
      signature,
    };
  } catch (error) {
    const errorMessage = (error as Error).message;
    throw new Error(
      `GelatoRelaySDK/getSignatureDataERC2771: Failed with error: ${errorMessage}`
    );
  }
};
