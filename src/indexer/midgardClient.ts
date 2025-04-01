import axios from "axios";
import { MidgardResponse } from "../types";

const MIDGARD_API_URL = "https://midgard.ninerealms.com";

export class MidgardClient {
  private baseUrl: string;

  constructor(baseUrl: string = MIDGARD_API_URL) {
    this.baseUrl = baseUrl;
  }

  async getActions(
    address: string,
    fromHeight?: number,
    nextPageToken?: string
  ): Promise<MidgardResponse["actions"]> {
    const url = `${this.baseUrl}/v2/actions`;
    const params: Record<string, string | number> = {
      address,
      fromHeight: fromHeight ? fromHeight : 0,
      limit: 600,
      offset: 0,
      type: "send",
    };

    if (nextPageToken) {
      params.nextPageToken = nextPageToken;
    }

    const response = await axios.get<MidgardResponse>(url, { params });
    return response.data.actions;
  }
}
