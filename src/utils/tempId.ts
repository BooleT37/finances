let lastTempId = -1;

export function generateTempId() {
  return lastTempId--;
}

export function isTempId(id: number) {
  return id < 0;
}
