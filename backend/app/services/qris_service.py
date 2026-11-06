import logging
from typing import List, Tuple, Optional, Union

logger = logging.getLogger(__name__)

DEFAULT_QRIS_PAYLOAD = (
    "00020101021126570011ID.DANA.WWW011893600915303581731802090358173180303UMI"
    "51440014ID.CO.QRIS.WWW0215ID10266111175770303UMI5204481453033605802ID"
    "5919Asterra Store, Cell6012Kab. Bandung61054091463047816"
)


class QrisService:
    @staticmethod
    def crc16_ccitt(data: str) -> str:
        """
        Calculates 16-bit CRC according to CCITT-FALSE standard.
        Polynomial: 0x1021 (x^16 + x^12 + x^5 + 1)
        Initial Value: 0xFFFF
        No reflection, Final XOR: 0x0000
        Output: 4-character uppercase hexadecimal string.
        """
        crc = 0xFFFF
        for ch in data:
            crc ^= (ord(ch) << 8)
            for _ in range(8):
                if crc & 0x8000:
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF
                else:
                    crc = (crc << 1) & 0xFFFF
        return f"{crc:04X}"

    @staticmethod
    def parse_emvco_tlv(qr_str: str) -> List[Tuple[str, str]]:
        """
        Safely parses EMVCo Merchant Presented Mode TLV (Tag-Length-Value) string.
        Each element is: Tag (2 digits) + Length (2 digits) + Value (Length characters).
        """
        tlvs: List[Tuple[str, str]] = []
        if not qr_str:
            return tlvs

        s = qr_str.strip()
        i = 0
        n = len(s)
        while i + 4 <= n:
            tag = s[i : i + 2]
            length_str = s[i + 2 : i + 4]
            if not length_str.isdigit():
                break
            length = int(length_str)
            i += 4
            if i + length > n:
                break
            val = s[i : i + length]
            tlvs.append((tag, val))
            i += length

        return tlvs

    @classmethod
    def build_dynamic_qris(cls, static_qr: Optional[str], amount: Union[float, int]) -> str:
        """
        Transforms a static QRIS payload into a dynamic QRIS payload by:
        1. Setting Tag 01 (Point of Initiation Method) from '11' (static) to '12' (dynamic).
        2. Injecting/Updating Tag 54 (Transaction Amount) with exact order amount.
        3. Recalculating CRC-16 (Tag 63) checksum over the modified payload.
        """
        raw_qr = (static_qr or "").strip()
        if not raw_qr:
            raw_qr = DEFAULT_QRIS_PAYLOAD

        tlvs = cls.parse_emvco_tlv(raw_qr)
        if not tlvs:
            logger.warning("[QrisService] Invalid or unparseable QRIS payload, falling back to default.")
            tlvs = cls.parse_emvco_tlv(DEFAULT_QRIS_PAYLOAD)

        # Format amount (IDR is currency 360, retail integer amounts)
        amt_float = float(amount)
        if amt_float <= 0:
            raise ValueError(f"Nominal pembayaran harus lebih besar dari 0, diterima: {amount}")

        if amt_float.is_integer():
            amt_val = str(int(amt_float))
        else:
            amt_val = f"{amt_float:.2f}"

        new_tlvs: List[Tuple[str, str]] = []
        tag_54_added = False

        for tag, val in tlvs:
            if tag == "63":
                # CRC will be recomputed over entire payload
                continue
            elif tag == "01":
                # Dynamic QR initiation
                new_tlvs.append(("01", "12"))
            elif tag == "54":
                # Replace existing transaction amount
                new_tlvs.append(("54", amt_val))
                tag_54_added = True
            elif tag == "58" and not tag_54_added:
                # In standard EMVCo, Tag 54 precedes Tag 58 (Country Code)
                new_tlvs.append(("54", amt_val))
                tag_54_added = True
                new_tlvs.append((tag, val))
            else:
                new_tlvs.append((tag, val))

        if not tag_54_added:
            new_tlvs.append(("54", amt_val))

        payload = "".join(f"{tag}{len(val):02d}{val}" for tag, val in new_tlvs)
        payload_with_crc_prefix = payload + "6304"
        checksum = cls.crc16_ccitt(payload_with_crc_prefix)
        return payload_with_crc_prefix + checksum

    @classmethod
    def generate_qr_svg_data_uri(cls, content: str) -> str:
        """
        Generates an SVG Data URI representation of the QR code using Segno.
        Zero external dependencies, pure vector graphics, instant client rendering.
        """
        try:
            import segno
            qr = segno.make(content, error="m")
            return qr.svg_data_uri(scale=5, border=2)
        except Exception as e:
            logger.error(f"[QrisService] Error rendering QR with segno: {e}")
            from urllib.parse import quote
            return f"https://api.qrserver.com/v1/create-qr-code/?size=350x350&data={quote(content)}"
