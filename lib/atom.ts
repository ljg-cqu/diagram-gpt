import { atom } from "jotai";

import type { Model } from "@/types/type";

export const apiKeyAtom = atom("");
export const modelAtom = atom<Model>("gpt-3.5-turbo");
export const baseUrlAtom = atom("");
