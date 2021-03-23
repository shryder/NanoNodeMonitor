document.addEventListener('DOMContentLoaded', function() {
	M.Dropdown.init(document.querySelectorAll('.dropdown-trigger'), {});
	M.Tooltip.init(document.querySelectorAll('.tooltipped'), {});
	
	$(".copy-to-clipboard").click(function(){
		let content = $(this).data('content');

		let element = document.createElement("input"); 
		element.type = 'text';
		element.value = content;
		element.style.position = "fixed"; // Prevent MS edge scrolling.
		document.body.append(element);
		element.select();
		document.execCommand("copy");
		document.body.removeChild(element);
	});

	$("[data-timestamp]").each(function(i, el){
		let date = moment.unix($(el).data('timestamp'));

		$(el).attr('data-tooltip', date.toString());
		$(el).text(date.fromNow());
	});

});
