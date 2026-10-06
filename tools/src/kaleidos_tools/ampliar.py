"""`kaleidos ampliar`: Real-ESRGAN x2plus (spandrel) sobre work/ilustraciones/ → media/extras/."""
from .comun import Proyecto, cronometro
from .ilustrar import ampliar


def ejecutar(args) -> int:
    proy = Proyecto(args.slug)
    with cronometro(proy, "ampliar") as extra:
        extra.update(ampliar(proy, args.imagen, args.tesela))
    return 0
