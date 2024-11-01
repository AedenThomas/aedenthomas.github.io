import React from "react";
import { motion } from "framer-motion";
import { ReactComponent as ReactIcon } from "./icons/react.svg";
import { ReactComponent as ReactNativeIcon } from "./icons/react-native.svg";
import { ReactComponent as PythonIcon } from "./icons/python.svg";
import { ReactComponent as FlutterIcon } from "./icons/flutter.svg";
import { ReactComponent as AspNetCoreIcon } from "./icons/aspnetcore.svg";
import { ReactComponent as DefaultIcon } from "./icons/default.svg";

const icons = {
  react: ReactIcon,
  "react native": ReactNativeIcon,
  python: PythonIcon,
  flutter: FlutterIcon,
  "asp.net core": AspNetCoreIcon,
};

const LanguageIcon = ({ language }) => {
  const IconComponent = icons[language.toLowerCase()] || DefaultIcon;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0, display: 'none' }}
      animate={{ opacity: 1, scale: 1, display: 'inline-block' }}
      exit={{ opacity: 0, scale: 0, display: 'none' }}
      transition={{ duration: 0.2 }}
      className="inline-block ml-1"
    >
      <IconComponent 
        width="24" 
        height="24" 
        style={{ visibility: 'visible' }}
      />
    </motion.span>
  );
};

export default LanguageIcon;
