# Assets

**Art direction:** A bright, child-friendly desert adventure viewed from a third-person camera. Golden rippled sand and rounded coral sandstone forms establish the route. A soft tan camel with a jewel-toned saddle is large and friendly, cacti have bold green silhouettes, quicksand is a dark cocoa ripple rather than ordinary sand, and the distant oasis uses saturated greens and blue water for immediate contrast. The scene stays clean, chunky, and non-scary.

## Textures

| Name | Description | Size | Image |
|---|---|---:|---|
| desert sand | Warm golden sand with subtle ripples and grains; repeated across the desert floor. | 2m repeat | `https://files.manuscdn.com/user_upload_by_module/session_file/310519663940279136/ArEOdrOdqLrUPnrZ.png` |

## Reference images

| Name | Description | Size | Image |
|---|---|---:|---|
| Level 5 desert visual target | Gameplay composition showing the camel, robot, cacti, lizards, distinct quicksand, cliff, and oasis. | 2560×1440 | `/home/ubuntu/bellhop-art/level5-desert-reference.png` |

The texture was generated through the Manus image generator and is loaded by `src/desert.js` when reachable. The runtime keeps a warm procedural sand material visible until the remote image is available and after a failed request, so an unavailable CDN cannot make the floor black. The high-resolution reference remains in sandbox art storage for visual QA rather than being committed to the self-contained game repository.
