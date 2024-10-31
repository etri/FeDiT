<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<style>
	li {
		font-size: 20px;
	}
</style>
<div class="nav-tabs-custom">
	<ul class="nav nav-tabs">
		<li class="active"><a href="#glyphicons" data-toggle="tab" aria-expanded="false">Icon</a></li>
	</ul>
	<div class="tab-content">
		<div class="tab-pane active" id="glyphicons">
			<div class="btn-group">				
				<a class="btn btn-app"  onclick="opener.setIcon('accessibility');window.close();"><i  class="material-icons">accessibility</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('accessible');window.close();"><i  class="material-icons">accessible</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('account_balance');window.close();"><i  class="material-icons">account_balance</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('account_box');window.close();"><i  class="material-icons">account_box</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('android');window.close();"><i  class="material-icons">android</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('all_inbox');window.close();"><i  class="material-icons">all_inbox</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('face');window.close();"><i  class="material-icons">face</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('insert_chart');window.close();"><i  class="material-icons">insert_chart</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('label_important');window.close();"><i  class="material-icons">label_important</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('dashboard');window.close();"><i  class="material-icons">dashboard</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('assessment');window.close();"><i  class="material-icons">assessment</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('assignment');window.close();"><i  class="material-icons">assignment</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('assignment_ind');window.close();"><i  class="material-icons">assignment_ind</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('assignment_late');window.close();"><i  class="material-icons">assignment_late</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('assignment_return');window.close();"><i  class="material-icons">assignment_return</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('assignment_returned');window.close();"><i  class="material-icons">assignment_returned</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('assignment_turned_in');window.close();"><i  class="material-icons">assignment_turned_in</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('autorenew');window.close();"><i  class="material-icons">autorenew</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('backup');window.close();"><i  class="material-icons">backup</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('book');window.close();"><i  class="material-icons">book</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('bug_report');window.close();"><i  class="material-icons">bug_report</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('build');window.close();"><i  class="material-icons">build</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('calendar_today');window.close();"><i  class="material-icons">calendar_today</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('camera_enhance');window.close();"><i  class="material-icons">camera_enhance</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('card_giftcard');window.close();"><i  class="material-icons">card_giftcard</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('check_circle');window.close();"><i  class="material-icons">check_circle</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('chrome_reader_mode');window.close();"><i  class="material-icons">chrome_reader_mode</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('commute');window.close();"><i  class="material-icons">commute</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('credit_card');window.close();"><i  class="material-icons">credit_card</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('delete');window.close();"><i  class="material-icons">delete</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('done_outline');window.close();"><i  class="material-icons">done_outline</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('eco');window.close();"><i  class="material-icons">eco</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('event');window.close();"><i  class="material-icons">event</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('favorite');window.close();"><i  class="material-icons">favorite</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('explore');window.close();"><i  class="material-icons">explore</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('fingerprint');window.close();"><i  class="material-icons">fingerprint</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('flight_takeoff');window.close();"><i  class="material-icons">flight_takeoff</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('hourglass_empty');window.close();"><i  class="material-icons">hourglass_empty</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('gavel');window.close();"><i  class="material-icons">gavel</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('grade');window.close();"><i  class="material-icons">grade</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('help');window.close();"><i  class="material-icons">help</i></a>
				<a class="btn btn-app"  onclick="opener.setIcon('brightness_high');window.close();"><i class="material-icons">brightness_high</i></a>

			</div>
		</div>
	</div>
</div>

<script>
	function setIcon(icon) {
		alert(icon);
	}
</script>