import nacl from "tweetnacl";
import util from "tweetnacl-util";
import { keccak256 } from "js-sha3";
import bs58 from "bs58";
import BN from "bn.js";
import secrets from "secrets.js-grempe";

let web3Utils = require("web3-utils");

export function bnToBytes(bn: BN, length: number) {
  return hexToBytes(bn.toString(16, length));
}

export function bytesToBn(bytes: Uint8Array) {
  return new BN(bytesToHex(bytes).substring(2), 16);
}

// HACKITY HACK HACK
// WARNING: this requires that there be less than 256 shares!!!!!
// NOTE: shareToBytes will return a length 50 Uint8Array
export function shareToBytes(share: string): Uint8Array {
  const { bits, id, data } = secrets.extractShareComponents(share);
  const bytes = [];
  bytes.push(bits);
  bytes.push(id);
  bytes.push(...Array.from(hexToBytes(data)));
  return new Uint8Array(bytes);
}

export function bytesToShare(bytes: Uint8Array): string {
  const bits = bytes[0];
  const id = bytes[1];
  let idByte = id.toString(16);
  if (idByte.length === 1) idByte = "0" + idByte;
  const data = bytes.subarray(2);
  return bits.toString(36) + idByte + bytesToHex(data).substr(2);
}

// Convert a hex string to a byte array
export function hexToBytes(hex: string) {
  if (hex.indexOf("0x") === 0) hex = hex.substring(2);

  const length = hex.length / 2;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array) {
  let hex = "0x";

  for (let i = 0; i < bytes.length; i++) {
    // We need to pad the hex digit with 0
    hex += ("0" + bytes[i].toString(16)).slice(-2);
  }

  return hex;
}

// Convert a base58 string to a byte array
export function base58ToBytes(base58: string) {
  const bytes = new Uint8Array(bs58.decode(base58));
  return bytes;
}

export function bytesToBase58(bytes: Uint8Array): string {
  return bs58.encode(bytes);
}

export function hexArrayToBytes(hexArray: string[]) {
  return new Uint8Array(hexArray.map(hex => parseInt(hex.substring(2), 16)));
}

export function bytesToHexArray(bytes: Uint8Array) {
  return Array.from(bytes).map(x => "0x" + x.toString(16));
}

function concat(array1: Uint8Array, array2: Uint8Array) {
  const newArray = new Uint8Array(array1.length + array2.length);
  newArray.set(array1);
  newArray.set(array2, array1.length);
  return newArray;
}

export function sha3(bytes: Uint8Array) {
  console.log("using soliditySha3");
  return hexToBytes(web3Utils.soliditySha3(bytesToHex(bytes)));
  // return new Uint8Array(keccak256.update(bytes).arrayBuffer());
}

export function createNonce() {
  return nacl.randomBytes(24);
}

export function encryptSecretForRevealer(
  messageSecret: Uint8Array,
  nonce: Uint8Array,
  revealerPublicKey: Uint8Array,
  secretKey: Uint8Array
) {
  return nacl.box(messageSecret, nonce, revealerPublicKey, secretKey);
}

export function decryptSecretForRevealer(
  encryptedSecret: Uint8Array,
  nonce: Uint8Array,
  dealerPublicKey: Uint8Array,
  revealerSecretKey: Uint8Array
) {
  return nacl.box.open(
    encryptedSecret,
    nonce,
    dealerPublicKey,
    revealerSecretKey
  );
}

export function buildMessageSecret(
  nonce: Uint8Array,
  dealerSecret: Uint8Array
) {
  return sha3(concat(nonce, dealerSecret));
}

export function encryptMessage(
  obj: Object,
  nonce: Uint8Array,
  secret: Uint8Array
) {
  const dataBytes = util.decodeUTF8(JSON.stringify(obj));
  return nacl.secretbox(dataBytes, nonce, secret);
}

export function decryptMessage(
  data: Uint8Array,
  nonce: Uint8Array,
  secret: Uint8Array
) {
  const decrypted = nacl.secretbox.open(data, nonce, secret);
  return JSON.parse(util.encodeUTF8(decrypted));
}

export function secretKeyToPublicKey(secret: Uint8Array) {
  return nacl.box.keyPair.fromSecretKey(secret).publicKey;
}
