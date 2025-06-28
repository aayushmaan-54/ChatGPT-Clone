"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { messagesWithName, messagesWithoutName } from "~/common/data/intro-message";



export default function IntroMessage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [randomMessage, setRandomMessage] = useState("");


  useEffect(() => {
    if (!isLoaded) return;

    const allMessages = isSignedIn && user?.firstName
      ? [
        ...messagesWithoutName,
        ...messagesWithName.map((msg) =>
          msg.replace("{name}", user.firstName || "there")
        ),
      ]
      : messagesWithoutName;

    setRandomMessage(allMessages[Math.floor(Math.random() * allMessages.length)]);
  }, [isLoaded, isSignedIn, user?.firstName]);


  if (!isLoaded) {
    return (
      <h1 className="text-3xl text-center text-muted-foreground">
        Loading...
      </h1>
    );
  }


  return (
    <h1 className="sm:text-3xl text-2xl text-center">
      {randomMessage}
    </h1>
  );
}
