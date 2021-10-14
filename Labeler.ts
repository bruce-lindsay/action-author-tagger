import { getOctokit } from "@actions/github";
import { RestEndpointMethods } from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types";

interface LabelerOptions {
  owner: string;
  repository: string;
  pull: number;
  auth: string;
}

function base64ToString(content: string) {
  return Buffer.from(content, 'base64').toString();
}

export class Labeler {
  rest: RestEndpointMethods;
  opts: LabelerOptions;

  constructor(opts: LabelerOptions) {
    this.rest = getOctokit(opts.auth).rest;
    this.opts = opts;
  }

  async getStringContent(path: string): Promise<string> {
    const result = await this.rest.repos.getContent({
      owner: this.opts.owner,
      repo: this.opts.repository,
      path: path
    });

    const b64 = (<{ content?: string }>result.data).content;

    if (b64) {
      return base64ToString(b64);
    } else {
      throw Error("No content in specified path");
    }
  }

  async readPull(): Promise<{ author: string, existingLabels: ReadonlyArray<string> }> {
    return await this.rest.issues.get({ owner: this.opts.owner, repo: this.opts.repository, issue_number: this.opts.pull })
      .then(response => response.data)
      .then(data => ({
        author: data.user?.login || '',
        existingLabels: data.labels
          .map(unk => (typeof unk === "string") ? unk : unk.name || '')
          .filter(s => !!s)
      }));
  }

  async addLabel(currentLabels: ReadonlyArray<string>, newLabel: string) {
    if (!newLabel) {
      console.log('No label to add');
    } else if (currentLabels.includes(newLabel)) {
      console.log('Label already present');
    } else {
      return await this.rest.issues.update({
        owner: this.opts.owner,
        repo: this.opts.repository,
        issue_number: this.opts.pull,
        labels: [...currentLabels, newLabel]
      })
        .then(_ => Promise.resolve());
    }
    return Promise.resolve();
  }
}