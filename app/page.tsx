import type { Metadata } from "next";
import { StillGoodApp } from "./StillGoodApp";

export const metadata: Metadata = {
  title: "StillGood — What can this computer still do?",
  description:
    "An automated, practical usability test for older and second-life computers.",
};

export default function Home() {
  return <StillGoodApp />;
}
