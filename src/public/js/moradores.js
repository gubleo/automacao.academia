class Moradores extends EndPoint {

    constructor(params) {
        super();
        this.listar = '/condominio/gym_users?unidade=eq.';

        this.AbrirRecurso('html/listamoradores.html').then(value => {
            params.page.innerHTML = value.toString();
            this.Listar(params.unidade).then(value => {
                this.MontaListView(value);
            });
        });
    }

    MontaListView(lista) {

        let modelo = document.getElementById('tplmoradores');
        let gridmoradores = document.getElementById('gridmoradores');

        lista.filter(function (item) {

            let linha = modelo.content.cloneNode(true);
            linha.getElementById('nome').innerText = item.nome.initCap();
            linha.getElementById('idade').innerText = item.idade;

            if (item.foto1 !== null && item.foto1.length > 100) {
                let foto = linha.getElementById('foto-usuario');
                foto.style.backgroundImage = 'url("' + item.foto1 + '")';
                foto.style.backgroundRepeat = 'no-repeat';
                foto.style.backgroundPosition = 'center';
                foto.style.backgroundSize = 'cover'
            }

            if (item.idade === null) {
                linha.getElementById('num').addEventListener('click', function () {
                    window.dispatchEvent(new CustomEvent('AoSelecionarMorador', {
                        detail: {
                            morador: item
                        }
                    }));
                });
            } else {
                linha.getElementById('num').className = 'row mt-3 p-3 border-bottom2 naopermitido';
                linha.getElementById('iconemorador').className = '';
            }

            gridmoradores.appendChild(linha);

        });

        window.dispatchEvent(new CustomEvent('AoCaregarMoradores', {}));
    }
}