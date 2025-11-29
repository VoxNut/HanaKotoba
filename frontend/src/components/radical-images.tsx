import * as React from "react";

interface Props {
  radicalImageArray?: string[] | any[];
}

const RadicalImages: React.FC<Props> = ({ radicalImageArray = [] }) => {
  if (!radicalImageArray || radicalImageArray.length === 0) return null;

  // radicalImageArray entries might be objects, try to extract src
  const images = radicalImageArray
    .map((item) => {
      if (typeof item === "string") return item;
      if (item?.url) return item.url;
      if (item?.src) return item.src;
      return null;
    })
    .filter(Boolean) as string[];

  if (images.length === 0) return null;

  // show first frame by default, could be extended to animate
  return (
    <div className="w-full h-full flex items-center justify-center">
      <img
        src={images[0]}
        alt="Radical animation frame"
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};

export default RadicalImages;
