import React from "react";
import { Typography } from "@mui/material";

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      Copyright © Abhyudaya Sharma, Grant Lee, Muskaan Patel (Brown University){" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

export default Copyright;
