import { configure } from "mobx";

export default function configureMobx() {
  configure({
    enforceActions: "always",
    computedRequiresReaction: true,
    reactionRequiresObservable: true,
    observableRequiresReaction: true,
  });
}
