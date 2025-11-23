import React from "react";
import { playSound } from "../utils/clickSound";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  soundName: string; // e.g. 'Keyboard_1' or 'Keyboard_1.mp3'
};

export default function SoundButton({ soundName, children, ...rest }: Props) {
  return (
    <button
      data-skip-global-sound
      {...rest}
      onClick={(e) => {
        // call user-provided onClick first (if any)
        if (rest.onClick) rest.onClick(e);
        // then play sound
        playSound(soundName);
      }}
    >
      {children}
    </button>
  );
}
