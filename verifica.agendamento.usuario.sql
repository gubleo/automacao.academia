create or replace function acesso.verifica_agendamento_usuario(_autenticacao character varying, _equipamento integer) returns boolean
    language plpgsql
as
$$
    /**
      Verifica se existe um agendamento para o usuário no espaço informado
     */
declare
begin
    if (
        select count(*)
          from acesso.reserva
         where upper(autenticacao) = upper(_autenticacao)
           and equipamento = _equipamento
           and inicio::date = current_date
           and (current_timestamp between inicio and final + interval '5' minute) = true
    ) = 0 then
        return false;
    end if;
    return true;
end
$$;