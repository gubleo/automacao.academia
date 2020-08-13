class Moradores extends EndPoint {

    constructor(params) {
        super();
        this.listar = '/condominio/gym_users?unidade=eq.';

        this.AbrirRecurso('html/listamoradores.html').then(value => {
            params.page.innerHTML = value.toString();
            this.ListaMoradores(params.unidade.num).then(value => {
                this.MontaListView(value);
            });
        });
    }

    ListaMoradores(unidade) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: '/condominio/rpc/gymlistusers',
                headers: {
                    Prefer: 'params=single-object',
                },
                dataType: 'json',
                success: function (response) {
                    resolve(response);
                }.bind(this),
                data: {unidade: unidade}
            }).fail(function (jqXHR) {
                reject(jqXHR);
            });
        })
    }

    MontaListView(lista) {

        let modelo = document.getElementById('tplmoradores');
        let gridmoradores = document.getElementById('gridmoradores');

        lista.filter(function (item) {

            let linha = modelo.content.cloneNode(true);
            linha.getElementById('nome').innerText = item.nome.initCap();
            // linha.getElementById('idade').innerText = item.idade;

            let hora = linha.getElementById('hora');
                hora.className = 'ml-1 font-small row grey-text';

            linha.getElementById('num').className = 'row mt-3 p-3 pointer-event waves-effect border-bottom-reservado';

            if (item.hora !== null) {
                if (item.hora > new Date().getHours()) {
                    hora.innerText =  'Reservado às ' + item.hora  + ' horas';
                } else {
                    hora.innerText = 'Reserva finalizada as ' + item.hora + 'hs';
                    hora.className = 'font-small ml-1 row blue-text';
                }
            } else {
                hora.innerText = 'Não possui nenhuma reserva para hoje';
                linha.getElementById('num').className = 'row mt-3 p-3 pointer-event waves-effect border-bottom-reservas';
            }


            if (item.foto1 !== null && item.foto1.length > 100) {
                let foto = linha.getElementById('foto-usuario');
                foto.style.backgroundImage = 'url("' + item.foto1 + '")';
                foto.style.backgroundRepeat = 'no-repeat';
                foto.style.backgroundPosition = 'center';
                foto.style.backgroundSize = 'cover'
            }

            console.debug(item);
            if (item.idade === 'inferior') {

                linha.getElementById('num').className = 'row mt-3 p-3 border-bottom2 naopermitido';
                linha.getElementById('iconemorador').className = '';
                linha.getElementById('idade').innerText = 'Não possui idade suficiente.';
                hora.style.display = 'none';

            } else {

                
                if (item.idade === 'acompanhante') {
                    linha.getElementById('num').className = 'row mt-3 p-3 border-bottom2 acompanhante';
                    linha.getElementById('idade').innerHTML = '<i class="fas fa-exclamation-triangle mr-1 pt-1"></i> Necessário acompanhante da Unidade.';
                    hora.style.display = 'none';
                }

                linha.getElementById('num').addEventListener('click', function () {
                    window.dispatchEvent(new CustomEvent('AoSelecionarMorador', {
                        detail: {
                            morador: item
                        }
                    }));
                });

            }

            gridmoradores.appendChild(linha);

        });

        window.dispatchEvent(new CustomEvent('AoCaregarMoradores', {}));
    }
}