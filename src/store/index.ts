import { useState, useEffect } from "react";

const useStore = <T, F>(
  store: (_callback: (_state: T) => unknown) => unknown,
  callback: (_state: T) => F
) => {
  const result = store(callback) as F;
  const [data, setData] = useState<F>();

  useEffect(() => {
    setData(result);
  }, [result]);

  return data;
};

export default useStore;
