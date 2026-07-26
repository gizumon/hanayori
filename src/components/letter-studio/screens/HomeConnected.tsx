"use client";

import { useStudio } from "../StudioContext";
import { HomeScreen } from "./HomeScreen";

export function HomeConnected() {
  const api = useStudio();
  return (
    <HomeScreen
      projects={api.state.projects}
      loading={api.loadingEvents}
      onOpen={api.openProject}
      onNew={() => api.setModalShown(true)}
    />
  );
}
