"""`kaleidos profundidad`: Depth Anything V2 Base sobre work/ilustraciones/ → media/extras/."""
from .comun import Proyecto, cronometro
from .ilustrar import profundidad


def ejecutar(args) -> int:
    proy = Proyecto(args.slug)
    with cronometro(proy, "profundidad") as extra:
        extra.update(profundidad(proy, args.imagen))
    return 0
