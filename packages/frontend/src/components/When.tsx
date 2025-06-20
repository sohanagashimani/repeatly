import React from "react";

const When = ({
  condition,
  children,
}: {
  condition: boolean;
  children: React.ReactNode;
}) => {
  return <>{condition && children}</>;
};

export default When;
