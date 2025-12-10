import React, { useEffect, useState } from "react";
import { Text } from "react-native";

const AnimatedDots: React.FC = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Text className="text-center text-sm text-gray-500 px-6 mt-2">{dots}</Text>
  );
};

export default AnimatedDots;
