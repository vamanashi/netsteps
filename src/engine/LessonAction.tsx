import { createContext, useContext } from "react";

export const LessonActionContext = createContext<HTMLElement | null>(null);
export const useLessonAction = () => useContext(LessonActionContext);
