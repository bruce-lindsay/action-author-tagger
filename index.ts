import { Labeler } from "./Labeler";
import YAML from "yaml";
import { context } from "@actions/github";
import { getInput } from "@actions/core";

const labeler = new Labeler({
  repository: context.repo.repo,
  owner: context.repo.owner,
  pull: context.issue.number,
  auth: getInput('token')
});

labeler.getStringContent('.github/label.yml')
  .then(fileContent => YAML.parse(fileContent)["autolabel-users"])
  .then((userToLabel: { [key: string]: string }) =>
    labeler.readPull()
      .then(pullInfo => ({
        tagForAuthor: userToLabel[pullInfo.author],
        existingLabels: pullInfo.existingLabels
      })))
  .then(({ existingLabels, tagForAuthor }) => labeler.addLabel(existingLabels, tagForAuthor))
  .then(_ => process.exit(0))
  .catch(e => {
    // avoid unhandled promise exception warning from nodejs
    console.error(e);
    process.exit(1);
  });
