/** 処理が一瞬で終わっても、落ち着いた体感速度になるよう最低表示時間を確保する */
export const withMinDuration = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const [result] = await Promise.all([promise, new Promise((resolve) => setTimeout(resolve, ms))]);
  return result;
};
